var express = require('express');
var router = express.Router();
var CybermoneyModel = require('../models/CybermoneyModel');
var ProductsModel = require('../models/ProductsModel');
var TotalCyberMoney = require('../libs/TotalCyberMoney');

router.get('/',function(req,res){
    res.send('pay app');
});


// 상품리스트 페이지
router.get('/productlist',function(req,res){
    res.render('product/productlist');
});


// 선택한 상품정로를 가져온다
router.post('/products_ajax',function(req,res){
    console.log('/products/proeicts_ajax 라우팅 함수 호출');
    req.session.productData = req.body;
    console.log(req.session.productData);
    res.json({message : "success"});
});


// 구매정보를 가지고 -> 결제페이지
router.get('/payview',function(req,res){
    console.log('/products/payview 라우팅 함수 호출');
    console.log('로그인한 user정보====',req.user);

    var ProductPrice = req.session.productData.price; //결제하고자 하는 금액
    var sumData;
    var add_sum=0;
    var minusData;
    var add_minus=0;
    var totalmoney =0;

    // 로그인 유무 체크 (로그인이 되어 있는 상태라면)
    if(typeof req.user !== 'undefined'){
        console.log("결제예정중인 상품정보==",req.session.productData);
        
        // 1. 현재 내가 보유중인 사이버머니 연산하기.
        // 사용자의 사이버머니 sum값 가져오기
        CybermoneyModel.find( { userid:req.user.userid , status:'sum' },function(err,List){
            sumData= List;
            sumData.forEach(function(element,index) { // sum값 더하기  //빈 배열일 경우 실행이 안됨.
                add_sum += element.cybermoney;
               // console.log(index,"번째 값",add_sum);
            });
            console.log('total add_sum==',add_sum); // 결제 이력이 없을 경우 0

            // 사용자의 사이버머니 minus값 가져오기 
            CybermoneyModel.find( { userid:req.user.userid , status:'minus' },function(err,List){
                minusData = List;
                minusData.forEach(function(element,index) {// minus값 더하기 //빈 배열일 경우 실행이 안됨.
                    add_minus += element.cybermoney;
                   // console.log(index,"번째 값",add_minus);
                }); 
                console.log('total add_minus==',add_minus); // 결제 이력이 없을 경우 0
                
                // 2. total값 구하기.
                // minus값이 크게 나올 수가 없는 구조이기 때문에 (add_sum>add_minus)값은 비교하지 않겠다.
                // find / find 안에서 처리 한 이유.  : 비동기 방식으로 순차적실행이 안되기때문에 함수 안의 안에서 처리하였다.
                totalmoney = add_sum-add_minus;
                console.log('totalmoney===',totalmoney);

                // 3. 결제상품금액과 보유금액 비교후 페이지 넘기기.
                if(ProductPrice < totalmoney || ProductPrice == totalmoney){
                    var AfterMoney = totalmoney - ProductPrice;
                    res.render('product/Payment',{ productData : req.session.productData, totalmoney:totalmoney, AfterMoney:AfterMoney, displayname:req.user.displayname }); //사이버머니 값도 같이 가져가기
                
                }else if(ProductPrice > totalmoney){
                    res.render('product/PaymentRetrun',{ productData : req.session.productData, totalmoney : totalmoney}); //사이버머니 값도 같이 가져가기
                    //     res.send('<script type="text/javascript"> alert("사이버머니가 없습니다 충전해주세요.");\
                    //     document.location.href = "/pay/pricelist";\
                    //     </script>');
                }
            });
        });
    }else{
        res.send('<script type="text/javascript">alert("로그인 후 구매 가능합니다.");\
        document.location.href = "/accounts/login";\
        </script>');
    }
});


router.post('/complete',function(req,res){
    console.log('/product/complete 라우팅 함수 호출');
    
    //var sumData;
    //var add_sum=0;
    //var minusData;
    //var add_minus=0;
    var totalmoney =0;
    var userid = req.user.userid;
    var productData = req.session.productData;
    var totalmoney = req.body.totalmoney;
    console.log("totalmoney==",totalmoney);

    console.log(userid);
    console.log("상품구매정보 ====", productData);
    
    //cybermoney DB정보 추가( status : minus )
    //var cybermoney = new CybermoneyModel({
    //     userid : checkoutList.userid,
    //     cybermoney : data.response.amount * 1000,  // 사이버머니 정제구역.
    //     status : 'sum',
    //     pay_by : 'card',
    //     payment_id : checkoutList._id
    // });
    
    var cybermoney = new CybermoneyModel({
        userid : userid,
        cybermoney : productData.price,
        status : 'minus'
    });
    cybermoney.save(function(err,data){
        //console.log("CybermoneyModel data==",cybermoney);
        console.log('사이버머니 minus정보 등록 성공==============================');
        // ProductModel DB정보 추가 (구매정보.)
        var SaveProductData = new ProductsModel({
            userid : userid,
            productData : productData,
            cybermoney_id : cybermoney._id
        });
        SaveProductData.save(function(err,data){
            console.log('상품구매정보 등록 성공==============================');
            // 연산 모듈화 하기..!
            // var totlamoney = TotalCyberMoney(req.user.userid);
            req.session.totalmoney =  totalmoney-productData.price;
            console.log(req.session.totalmoney); 
            res.json({message:'success'});
        });
    });

});

router.get('/success',function(req,res){
    console.log('/products/success 라우팅 함수 호출');
    res.render('product/success',{totalmoney:req.session.totalmoney});
});


module.exports= router;