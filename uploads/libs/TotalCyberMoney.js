
module.exports = function(userid) {
    
    // 다시짜기.
    var CybermoneyModel = require('../models/CybermoneyModel');
    var ProductsModel = require('../models/ProductsModel');
    
    // 1. 현재 내가 보유중인 사이버머니 연산하기.
    // 사용자의 사이버머니 sum값 가져오기
    var sumData;
    var add_sum=0;
    var minusData;
    var add_minus=0;
    var totalmoney =0;

    console.log(userid);
    CybermoneyModel.find( { userid:userid, status:'sum' },function(err,List){
        sumData= List;
        sumData.forEach(function(element,index) { // sum값 더하기  //빈 배열일 경우 실행이 안됨.
            add_sum += element.cybermoney;
            // console.log(index,"번째 값",add_sum);
        });
        console.log('total add_sum==',add_sum); // 결제 이력이 없을 경우 0

        // 사용자의 사이버머니 minus값 가져오기 
        CybermoneyModel.find( { userid:userid, status:'minus' },function(err,List){
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
            return totalmoney;
        });
    });

};