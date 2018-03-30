var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var CompanySchema = new Schema({
    add_company_writer : { // 기업회원 등록자
        type : String, 
        required : true
    },
    company_add_at : { // 기업 회원 등록일
        type : Date,
        default : Date.now()
    },
    company_name : { // 기업명
        type : String,
         required : true
    },
    manager_name : { // 담당자명
        type : String,
        required : true
    },
    manager_department : { // 담당자 부서명
        type : String,
        required : true
    },
    manager_email : { // 담당자 이메일
        type : String, 
         required : true
    },
    manager_tel : { // 담당자 전화번호
        type : String,
         required : true
    },    
    manager_title : { // 담당자 직함 
        type : String,
        required : true
    },
    company_note : { // 비고 
        type : String
    }
});

CompanySchema.virtual('getDate').get(function() {
    var date = new Date(this.company_add_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

CompanySchema.plugin( autoIncrement.plugin , {model : "company", field : "id", startAt : 1} );
module.exports = mongoose.model('company', CompanySchema);