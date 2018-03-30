var express = require('express');
var router = express.Router();
var couponcode = require('coupon-code');
var co = require('co');
var UserModel = require('../models/UserModel');
var PromotionCodeModel = require('../models/PromotionCodeModel');
var PromotionCodeUseModel = require('../models/PromotionCodeUseModel');
var CybermoneyModel = require('../models/CybermoneyModel');
var smtpTransport = require('../libs/smtpTransport');
var Codework = require('../libs/codework');


router.get('/',function(req,res){
    res.send('promotion app');
});

router.get('/sendcode',function(req,res){
    res.render('admin/promotioncode');
});



////////////////////////////////////////////////////////////////////////////////////////////////////




// 검색 자동완성기능
router.get('/searchAjax',function(req,res){
    console.log('/promotion/search 라우팅 함수 호출')
    var searchdata = req.query.searchdata;
    var regeexp = new RegExp(searchdata); // 부분일치 조회를 위해 정규식 객체 사용
    var query = {userid : regeexp};
    var mysort = {userid :1};
    
    UserModel.find(query).sort(mysort).exec(function(err,List){
        // console.log("searchdata===",searchList);
        res.render('admin/serchAjax',{searchList : List});
    });
});

// 검색결과
router.get('/searchDetailAjax',function(req,res){
    console.log('/promotion/searchDetail 라우팅 함수 호출');
    var userList= [];   // 회원 검색 결과를 정리해서 담을 변수
    var codeData=[];
    var searchdata = req.query.userid; // 찾고자 하는 데이터의 부분입력 값.
    var regexp = new RegExp(searchdata); // 부분일치 조회를 위해 정규식 객체 사용
    var query = {userid : regexp};
    var mysort = {userid :1};
    
    
    // ★ DB를 찾은 후 하고자 하는 동작 동기처리 함수를 파라미터로 전달.
    // 1. 검색하고자 하는 회원정보 전체 조회
    UserModel.find(query).sort(mysort).exec(function(err,List){
        console.log('검색결과 조회====',List.length);
        userList = List;


        // 3. promotioncode
        // var findFunc = function(query, callback) {
        //     PromotionCodeModel.find(query).exec(function(err, data){
        //         console.log('1 findFunc');
        //         console.log('2 promotioncodeData Length ===>',data.length);
        //         return data;
        //     });
        // };

        // // 4. findFunc에서 callback으로 던져저 실행될 함수
        // var savePromotionInfo = function( promotionData) {
        //     console.log('3 savePromotionInfo', promotionData);
        //     if (promotionData.length >=1 ){
        //         console.log('4 userData==>',user);
        //         console.log('5 promotionData==>',promotionData);
        //         for(idx in promotionData){
        //             // user.promotioncode = promotionData[idx].promotioncode;
        //             // console.log('6 user.promotioncode ===>',user.promotioncode);
                    
        //         }
        //     }
           
        // };

        // for ( idx in userList) { 
        //     var pRegexp = new RegExp(userList[idx].userid);
        //     var pQuery = {userid : pRegexp};
        //     // userList[idx].promotionData = findFunc(pQuery, savePromotionInfo);

        //     var findfunc = function (query){
        //         return new Promise(function(resolve, reject){
        //             PromotionCodeModel.find(query).exec(function(err, data){
        //                 console.log('1 findFunc');
        //                 console.log('1-2 promotioncodeData Length ===>',data.length);
        //                 resolve(data);
        //             });
        //         });
        //     };
        //     findfunc(pQuery).then(function(result){
        //         console.log('3. then함수');
        //         userList[idx].codeData =result;
        //         console.log(userList[idx]);
        //     });
            
        // }

        // userList.forEach(function (user) { 
        //     var pRegexp = new RegExp(user.userid);
        //     var pQuery = {userid : pRegexp};
        //     var findCodeData = findFunc(pQuery, savePromotionInfo);
        //     // 
        //     console.log(findCodeData);
        // });
        
        // ★ result 객체에 정리해서 담기.
        res.render('admin/tableAjax',{tableData : List});
    });


    // 회원의 코드발급 여부와 코드 정보 가져오기

    // 코드 승인 상태와 코드발급일 가져오기
    // res.render('admin/tableAjax',{tableData : List});

});



////////////////////////////////////////////////////////////////////////////////////////////////////




// 프로모션 코드 생성
router.get('/createcode_Ajax',function(req,res){
    console.log('/promotion/createcode_Ajax 라우팅 함수 호출');
    var adminid = req.user.userid;  // 관리자 ID
    var userid = req.query.userid;  // 발급받은 userID
    var maxnum =  req.query.maxnum;  // 코드 최대 사용자
    var eventType = req.query.eventType; // 이벤트 타입
    var codeType ;  // 코드발급 타입
    var codecount = 0;  // 프로모션 코드 DB 일치 여부 확인을 위한 변수
    var promotioncode;  // 발급된 프로모션 코드 저장을 위한 변수

        
    
    // 1. 코드발급 및 일치여부 확인 함수
    var createcode = co(function* (){   
        promotioncode = couponcode.generate({parts : 4});
        codecount = yield PromotionCodeModel.count({promotioncode : promotioncode}).exec();
        while(codecount) {
            promotioncode = couponcode.generate({parts : 4});
            codecount = yield PromotionCodeModel.count({promotioncode : promotioncode}).exec();
         }

        return {
            promotioncode : promotioncode,
            codecount : codecount
        };
    });

    // 개별발급 및 체크박스 발급시
    // user가 정해져 있다면
    if(userid !== undefined){
        if(userid.slice(0,1)==","){
            userid = userid.slice(1);
        }
        console.log(userid);
        // 2. 1번 코드발급 함수를 돌린다음 DB에 저장할 데이터에 Schema생성
        createcode.then(function(result){
            promotioncode = result.promotioncode;
            var SavePromotionCodeData = new PromotionCodeModel({
                promotioncode : promotioncode,
                adminid : adminid,
                userid : userid,
                maxnum : maxnum,
                eventType: eventType,
                codeType : 'private'
            });
            // DB에 저장
            SavePromotionCodeData.save(function(err,data){
                console.log('프로모션 코드 DB등록 성공 ========================');

                // 3. 발급된 코드 DB저장 후 회원에게 코드안내 e-mail 발송
                var  mailOptions, host, link;
                host=req.get('host');
                link="http://"+req.get('host')+"/accounts/login";
                
                // email전송 옵션 
                mailOptions={
                    to : userid,
                    subject : "팝콘사 - 프로모션 코드 발행",
                    html : "아래와 같이 프로모션 코드가 발행 되었습니다.<br> 로그인 후 마이페이지-> 프로모션 코드 입력해주시기 바랍니다. ..<br>\
                            <br> 프로모션코드 :"  + promotioncode + "<br><a href="+link+"> <br>Login </a><br><br>PopcornSAR"	
                }

                //email발송 함수
                smtpTransport.sendMail(mailOptions, function(error, response){
                    if(error){
                        console.log(error);
                        res.json({message : userid+'메일 전송 중 error발생' });
                    }else{
                        console.log(userid+'메일 전송 성공');
                        res.json({message : userid+'메일 전송 성공'});
                    }
                });
            });
        });


    }else{  // 불특정 회원 발급시
        createcode.then(function(result){

            if(maxnum == 0){ // 최소값이 0이 될수 없게 막기
                res.json({message : '발급인원 수는 0이상을 기입하세요.'});
            }else{
                promotioncode = result.promotioncode;
                console.log('불특정 인원 발급쪽',promotioncode,adminid,userid,maxnum,eventType);
                var SavePromotionCodeData = new PromotionCodeModel({
                    promotioncode : promotioncode,
                    adminid : adminid,
                    maxnum : maxnum,
                    eventType: eventType,
                    codeType : 'public'
                });
                SavePromotionCodeData.save(function(err,data){
                    if(err){
                        console.log(err);
                    }else{
                        res.json({message : '코드발급 성공'});
                    }
                });
            }

        });
    }

});


////////////////////////////////////////////////////////////////////////////////////////////////////



// 마이페이지 -> 프로모션 코드 입력창 연결
router.get('/mycode',function(req,res){
    res.render('mypage/promotioncode');
}); 


router.post('/usemycode_Ajax',function(req,res){
    console.log('/promotion/usemycode_Ajax 라우팅 함수 호출');
    var userid = req.user.userid; 
    var writecode = req.body.promotioncode;    
    var codedDbData; // writecode와 일치하난 code정보
    var codecount=0;
    // console.log(userid, writecode);


    // 1. 코드는 쓸 수 있는가?
    // codeDB에 일치하는 code가 있는지 조회
    PromotionCodeModel.findOne({promotioncode : writecode}, function(err,Data){

        // 일치하는 코드가 없으면
        if(Data == null){
             console.log('코드정보를 잘못 입력하셨습니다.');

        // 일치하는 정보가 있을 경우 변수에 담는다.
        }else{
            codedDbData = Data; 
            console.log("일치하는 정보를 출력합니다.------");
            console.log(codedDbData);

            ///////////////////////////////////////////////////////////////////////


            var authPromise = function (){
                return new Promise(function (resolve, reject){

                    // DB데이터에 codeType에 따라서 사용가능한 상태 인지 아닌지 체크
                    // 사용자가 정해진 경우(codeType "private")
                    if(codedDbData.codeType == "private"){
                        // 정해진 이름 안에 있는가?
                        var userid_split = codedDbData.userid.split(',');
                        var exist = false; 
                        console.log("codeType private");
        
                        for(idx in userid_split) {
                            if(userid_split[idx] == userid){
                                exist =true;
                                break;
                            }
                        }
                        console.log(exist);
                        if (exist){
                            resolve(true);
                        }else {
                            resolve(false);
                            res.json({message : "해당 유저에게 사용권한이 없습니다"});
                        }
                        
                    }else{  // 코드가 public인 경우
                        
                        // 인원수를 넘었는가?
                        console.log("codeType public");
                        
                        // console.log(codedDbData.promotioncode);
                        var publicPromise = function (){
                            return new Promise(function (presolve, preject){
                                PromotionCodeUseModel.count( { promotioncode : codedDbData.promotioncode }, function(err,result){
                                    console.log(result);
                                    console.log('인원수를 넘었는가?===>',result);
                                    
                                    if ( result < codedDbData.maxnum ){
                                        presolve(true);
                                    }else {
                                        presolve(false);
                                    }
                                });
                            });
                        };
                        publicPromise().then(function(result){
                            resolve(result);
                            console.log('authProise===>',result);
                            if(!result){
                                res.json({message : '해당코드는 사용인원을 초과하였습니다.'})
                            }
                        });
                    } 
                });
            };
            authPromise().then(function(result){
                console.log('authPromise===>',result);
                if (result){
                    PromotionCodeUseModel.count({ promotioncode : codedDbData.promotioncode , userid: userid }, function(err,result){
                        console.log(result);
                        if( result === 0 ){
                                // 모듈로 분리하기
                                console.log('로그에 기록되어 있는가?===>',result);
    
                                var resultPromise = function (){
                                return new Promise(function (resolve, reject){
                                    console.log('Codework함수 실행준비============='); 
                                    Codework(codedDbData,userid, function(result){
                                        console.log('Codework함수 실행!!!!!!!!!!=============');
                                        if(result == undefined){ 
                                            resolve('Codework2 undefined');
                                        }else{
                                            console.log('elseelseelse=====');
                                            console.log(result);
                                            resolve(result);
                                        }
                                    }); 
                                });
                            };
                            resultPromise().then(function(result){
                                console.log('resultresult =======>',result);
                                res.json(result);
                            });
                        }else{
                            res.json({message : '이미 코드를 사용하셨습니다'});
                        }
                    });
                }
            });

        }
          
    });

});



module.exports=router;