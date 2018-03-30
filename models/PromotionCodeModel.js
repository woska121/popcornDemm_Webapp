var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');


var PromotioncodeSchema = new Schema({
    promotioncode : { type : String, required: true, unique : true}, // 프로모션 코드
    adminid : {type : String, required: true}, // 코드발급자
    userid : {type:String, 'default':""},    // 코드발급 받은 회원
    maxnum : {type : Number, required: true}, // 코드 사용 최대 인원
    eventType : {type : Object,  required: true}, // 코드 사용시 적용되는 이벤트타입과 이벤트설정내용
    codeType : {type : String, required : true}, // 프로모션 코드타입
    createdcode_at : { // 코드발급일
        type : Date,
        default : Date.now()
    }
});

PromotioncodeSchema.virtual('getDate').get(function() {
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

PromotioncodeSchema.plugin( autoIncrement.plugin , { model : 'promotioncodes' , field : 'id' , startAt : 1 });
module.exports = mongoose.model('promotioncodes', PromotioncodeSchema);