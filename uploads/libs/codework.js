

/////////// promotioncodeUseDB저장 및 EventType에 따른 DB저장  ////////////////////////////

var PromotionCodeUseModel = require('../models/PromotionCodeUseModel');
var CybermoneyModel = require('../models/CybermoneyModel');
var co = require('co');

// 공통사용하는 함수 (codeLogDB 저장 함수 여기다 선언하기)

module.exports = function (codedDbData, userid, callback){

    console.log('함수 정상 호출');
    var codedDbData =codedDbData;
    var userid =userid;
    var eventType = codedDbData.eventType;
    var result_codeLog={};
    console.log('eventType ====> ',eventType);
    

    // 이벤트 타입에 따른 처리 함수 생성
    switch(eventType.eventName){

        case 'cybermoney':

            // codeuseDB저장
            var codeLog = PromotionCodeUseModel({
                promotioncode : codedDbData.promotioncode,
                userid : userid
            });
            codeLog.save(function(err,Data){

                if(err){
                    console.log(err);
                    callback({ message : 'err'});

                }else{
                    console.log('savecodeLogDB 저장 성공===>',Data);
                    result_codeLog = Data;

                    // cybermoneyDB저장
                    var cybermoney = new CybermoneyModel({
                        userid : userid,
                        cybermoney : Number(eventType.chargeCybermoney),
                        status : 'sum',
                        payment_id : result_codeLog._id,
                        pay_by : 'promotioncode'
                    });

                    cybermoney.save(function(err,data){
                        if(err){
                            console.log(err);
                            callback({ message : 'err'});
                        }else{
                            console.log('cybermoneyDB 저장 성공===>',data);
                            callback({ message : '프로모션 코드가 적용이 되었습니다.'});
                        }
                    });
                }
            });

        // case 'addEvent2': // 이벤트 생성시 추가하기.
           
    } //switch





} //module.exports

