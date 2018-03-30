var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');

// 결제 완료 후 $ -> 사이버머니로 환전하여 저장
var CybermoneySchema = new Schema({
    userid : {type : String, required: true},    // 사용자 ID
    cybermoney : {type : Number, required: true},
    status : {type : String, required: true},
    payment_id : {type : ObjectId, required: true}, //paymentModel join을 위한 key
    pay_by :{type : String, required: true}, // 지불방법
    create_at : {
        type : Date,
        default : Date.now()
    }    
});

// 데이터 생성 날짜 설정
CybermoneySchema.virtual('getDate').get(function(){
    var date = new Date(this.create_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

CybermoneySchema.plugin(autoIncrement.plugin, {model :"cybermoneys",field : "id", startAt:1 });
module.exports= mongoose.model("cybermoneys", CybermoneySchema);

