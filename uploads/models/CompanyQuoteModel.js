var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var CompanyQuoteSchema = new Schema({
    writer : {
        type : String, // 작성자 이름 
        required : [true, '작성자 이름을 입력해주세요']
    },
    email : {
        type : String, // 답변 받을 이메일
        required : [true, '답변받을 이메일을 입력해주세요']
    },
    tel : { // 전화번호
        type : String,
        required : [true, '전화번호를 입력해주세요']
    },
    company_name : { // 회사명
        type : String,
        required : [true, '회사명을 입력해주세요']
    },
    quote_content : { //견적 문의 내용 
        type : String,
        required : [true, '견적 문의 내용을 입력하세요']
    },
    registered_at : { // 견적 문의 내용 등록일
        type : Date,
        default : Date.now()
    },
    answer_or_not : { // 관리자 답변 메일 여부
        type : Boolean,
        default : false
    }
});

CompanyQuoteSchema.virtual('getDate').get(function() {
    var date = new Date(this.registered_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});


CompanyQuoteSchema.plugin( autoIncrement.plugin , {model : "company_quote", field : "id", startAt : 1} );
module.exports = mongoose.model('company_quote', CompanyQuoteSchema);