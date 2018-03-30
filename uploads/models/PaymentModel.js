var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

// 결제 전 정보 DB에 저장
// 생성될 필드명 지정
var PaymentSchema = new Schema({
    
    userid : {type : String, required: true},    //사용자 ID
    merchant_uid : {type : String, required: true},   //상점 거래ID
    imp_uid : String,        // 아임포트 고유 ID
    paid_amount : {type : Number, required: true},    //결제금액

    buyer_name : {type : String, required: true},     // 구매자 이름
    buyer_tel : {type : String, required: true},    // 전화번호
    buyer_addr : {type : String, required: true},    // 구매자 주소
    buyer_postcode : {type : String, required: true},    // 구매자 우편번호

    status : {type : String, required: true},     // 결제상태

    created_at : {  // 데이터 생성 시간
        type : Date,
        default : Date.now()
    }

});



PaymentSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

// 1씩 증가하는 primary Key를 만든다
// model : 생성할 document 이름
// field : primary key , startAt : 1부터 시작
PaymentSchema.virtual('getAmountFormat').get(function(){
    // 1000원을 1,000원으로 바꿔준다.
    return new Intl.NumberFormat().format(this.paid_amount);
});

PaymentSchema.plugin( autoIncrement.plugin , { model: "payments", field : "id", startAt : 1 });
module.exports = mongoose.model( "payments", PaymentSchema);