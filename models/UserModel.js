var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var UserSchema = new Schema({
    userid : {
        type : String,
        required : [true, '아이디는 필수입니다.'],
        unique : true
    },
    password : {
        type : String,
        required : [true, '패스워드는 필수입니다.']
    },
    displayname : {
        type : String,
        unique : true
    },
    created_at : {
        type : Date,
        default : Date.now()
    },
    // 권한 (0 : 일반회원, 1 : 제 1관리자, 2 : 제 2관리자)
    authority : {
        type : Number,
        default : 0
    },
    // 활성상태 1(true) : 활성, 0(false) : 비활성 -> 탈퇴처리
    state : {
        type : Boolean,
        default : true
    },
    dormant_date : { // 휴면 전환 날짜
        type : Date
    },    
    dormant_mail_send : { // 휴면 전환 알림 메일 전송 여부
        type : Boolean,
        default : false
    },
    // 회원 휴면상태 여부 1(true) : 휴면상태, 0(false) : 정상상태 
    dormant_state : {
        type : Boolean,
        default : false,
    },
    // 탈퇴일자 
    withdraw_at : {
        type : Date
    },
    // 가입상태 이메일인증완료 1(true), 이메일인증미완료 0(false)
    email_verification_state : {
        type : Boolean,
        default : false
    },
    login_at : {
        type : Date
    },
    ide_authority : { // ide 사용권한
        type : Boolean,
        default : false
    },
    admin_register : { //관리자가 등록했는지 여부 (true일 경우 관리자가 직접 등록한 회원)
        type : Boolean,
        default : false
    },
    company_name : { //관리자가 등록할 때 기업 단체 회원인 경우 기업명 명시
        type : String,
        default : '일반'
    },
    grade : {   // 회원등급, 6월 release 시 필요
        type : String,
        default : 'trial'
    }
});

UserSchema.virtual('getDate').get(function() {
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

UserSchema.virtual('getWithdrawDate').get(function() {
    var date = new Date(this.withdraw_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate(),
        hour : date.getHours(),
        minutes : date.getMinutes()
    };
});

UserSchema.virtual('getDormantDate').get(function() {
    var date = new Date(this.dormant_date);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    }
});

UserSchema.virtual('getLoginDate').get(function() {
    var date = new Date(this.login_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate(),
        hour : date.getHours(),
        minutes : date.getMinutes()
    }
})

UserSchema.plugin( autoIncrement.plugin , {model : "user", field : "id", startAt : 1} );
module.exports = mongoose.model('user', UserSchema);


