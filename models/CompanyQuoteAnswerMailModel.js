var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var CompanyQuoteAnswerMailSchema = new Schema({
    quote_answer_from : {
        type : String, // 기업견적문의 답변 보낸 관리자
        required : true
    },
    quote_answer_to : {
        type : String, // 답변 받은 이메일(기업고객)
        required : true
    },
    quote_answer_title : { // 답변제목
        type : String,
        required : true
    },
    quote_answer_content : { // 답변내용
        type : String,
        required : true
    },
    quote_answered_at : {  // 답변 전송 시간 
        type : Date,
        default : Date.now()
    },
    
});

CompanyQuoteAnswerMailSchema.virtual('getDate').get(function() {
    var date = new Date(this.quote_answered_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});


CompanyQuoteAnswerMailSchema.plugin( autoIncrement.plugin , {model : "company_quote_answer", field : "id", startAt : 1} );
module.exports = mongoose.model('company_quote_answer', CompanyQuoteAnswerMailSchema);