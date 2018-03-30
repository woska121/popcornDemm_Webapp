var express = require('express');
var router = express.Router();
var PaymentModel = require('../models/PaymentModel');
var CompanyQuoteModel = require('../models/CompanyQuoteModel');
var CybermoneyModel = require('../models/CybermoneyModel');
var Client = require('node-rest-client').Client;

// REST API 사용을 위한 client 세팅
var client  = new Client();

router.get('/',function(req,res){
    res.send('pay app');
});

// 상품리스트 페이지
router.get('/pricelist',function(req,res){
     res.render('price/pricelist');
});

// 구매하기 클릭시 
router.post('/paydata',function(req,res){
    console.log('/pay/paydata 라우팅 함수 호출');
    var cybermoney = req.body;
    req.session.cybermoney=cybermoney;
    console.log(cybermoney);
    res.redirect('/pay/payview');
});


// 구매정보를 가지고 -> 결제페이지
router.get('/payview',function(req,res){
    console.log('/pay/payview 라우팅 함수 호출');
    console.log('로그인한 user정보====',req.user);

    // 로그인 유무 체크 
    if(typeof req.user !== 'undefined'){
        req.session.cybermoney.userid=req.user.userid;  //usser email저장
        console.log(req.session.cybermoney);
        res.render('price/paypal',{cybermoney:req.session.cybermoney});
    }else{
        // 회원이 아니라면 alert창 띄우고 로그인화면으로
        // console.log(req.session.cybermoney);
        res.send('<script type="text/javascript">alert("로그인 후 구매 가능합니다.");\
        document.location.href = "/accounts/login";\
        </script>');
    }
});


// 결제모듈 호출전 결제정보 DB저장
router.post('/savepay_ajax',function(req,res){
    console.log('/pay/savepay_ajax 라우팅 함수 호출');
    req.body.buyer_addr = req.body.buyer_addr + ' / ' + req.body.detail_addr;
    // console.log('사용자 구매정보DB 저장===',req.body);
    
    // DB저장하기
    var checkout = new PaymentModel({
        userid: req.body.userid,
        merchant_uid: req.body.merchant_uid,
        paid_amount: req.body.amount,

        buyer_name: req.body.buyer_name,
        buyer_tel: req.body.buyer_tel,
        buyer_addr: req.body.buyer_addr,
        buyer_postcode: req.body.buyer_postcode,
        
        status : 'ready'
    });

    // console.log(checkout);
    checkout.save(function(err,checkout){
        console.log('구매정보 저장성공');
        res.json({ message : "success" });
    });
});



// 결제모듈 연결 성공시 rortuer함수 호출을 위해
router.get('/trycomplete',function(req,res, next){

    console.log('/pay/trycomplete 라우팅 함수 호출');
    console.log('페이팔 요청 성공 후 전달받은 데이터===',req.query);
    var imp_uid = req.query.imp_uid;    // 승인요청후 받은데이터
    var merchant_uid = req.query.merchant_uid;  // 승인요청후 받은데이터
    var access_token;
    var checkoutList;

    // 내 DB에서 merchant_uid와 일치하는 정보 가져와서 금액값 뽑기
    PaymentModel.findOne({ merchant_uid : merchant_uid },function(err,List){
        //console.log("merchant_uid와 일치하는 데이터===",List);
        checkoutList = List;
        console.log("payments list data===",checkoutList);
    });

    // 아임포트 RESTAPI처리
    var args = {
        data:{
            imp_key :'7119456242500746',
            imp_secret : '7VQGWiFFqNCQni3NwzQBkheZ9Vl08o3gjUXgcDVCqysNQwAm5qYpIcpR8LSh9WytQvJ38FFyd8m3FXqK'
        },
        headers :{'Content-Type':'application/json'}
    };
    // 아임포트에서 인증토큰 받기 
    client.post("https://api.iamport.kr/users/getToken",args,function(data,response){
        access_token = data.response.access_token;

        // 받은 인증 토큰을 이용해 아임포트에서 결제정보 가져오기
        var args ={ headers :{'Content-Type':'application/json','Authorization':access_token} };
        client.get("https://api.iamport.kr/payments/"+imp_uid , args , function(data,response){
            //console.log("payments list data===",data);
            
            if(checkoutList.merchant_uid === data.response.merchant_uid){  //merchant_uid가 같다면?
                if(checkoutList.paid_amount === data.response.amount){   // 금액일치한다면?

                    // payments DB 정보 수정 (status :결제완료)
                    PaymentModel.update(
                        { merchant_uid : merchant_uid },   //조회조건
                        { $set : {status:'paid', imp_uid : imp_uid } },  // 결제승인시 아임포트 고유아이디추가
                        { upsert: true },
                        function(err,data){
                            console.log('결제정보 수정이력 :',data);
                        });

                        // cybermoneys DB 정보 추가 (status : sum)
                        var cybermoney = new CybermoneyModel({
                            userid : checkoutList.userid,
                            cybermoney : data.response.amount * 1000,  // 사이버머니 정제구역.
                            status : 'sum',
                            pay_by : 'card',
                            payment_id : checkoutList._id
                        });
                        cybermoney.save(function(err,data){
                            console.log('cybermoney 데이터 저장성공',data);
                        });
                    console.log("결제 성공===================================");
                    res.redirect('/pay/success');   // DB정보 수정 및 저장 후 결제성공 페이지로

                }else{// 금액이 일치 하지 않다면
                    // 결제 취소요청 하기 아임포트
                    var args = {
                        data:{
                            imp_uid :imp_uid,
                            merchant_uid : merchant_uid,
                            reason: 'chahge amount'
                        },
                        headers :{'Content-Type':'application/json','Authorization':access_token}
                    };
                    client.post("https://api.iamport.kr/payments/cancle",args, function(data,response){
                        console.log("결제취소 성공===================================");
                        console.log(data);
                        // 결제 취소 후 DB에 값 status cancelled 변경
                        PaymentModel.update(
                            { merchant_uid : merchant_uid },   //조회조건
                            { $set : {status:'cancelled', imp_uid : imp_uid } },  // 결제승인시 아임포트 고유아이디추가
                            { upsert: true },
                            function(err,data){
                        });
                        res.redirect('/pay/failed');   // DB정보 수정 후 결제성공 페이지로
                    });
                }
            }


        });
    });
});

// 결제 성공 페이지
router.get('/success', function(req,res){
    console.log('/pay/success 라우팅 함수 호출');
    res.render('price/success');
});

// 결제 실패 페이지
router.get('/failed', function(req,res){
    console.log('/pay/failed 라우팅 함수 호출');
    res.render('price/failed');
});





// 기업견적문의
router.get('/quote',function(req,res){
    res.render('price/quote');
});

// 기업견적문의 저장
router.post('/quote', function(req,res){
    var CompanyQuote = new CompanyQuoteModel({
      writer : req.body.writer,
      email : req.body.email,
      tel : req.body.tel,
      company_name : req.body.company_name,
      quote_content : req.body.quote_content
    });
    CompanyQuote.save(function(err) {
        res.send('<script>alert("견적문의 등록 완료");location.href="/pay/pricelist";</script>');
    });
});


module.exports = router;