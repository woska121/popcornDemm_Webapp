var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var UserSchema = new Schema({
    userid : {
        type : String,
        required : [true, '아이디는 필수입니다.']
    },
    password : {
        type : String,
        required : [true, '패스워드는 필수입니다.']
    },
    displayname : String,
    created_at : {
        type : Date,
        default : Date.now()
    },
    // 관리자권한  1(true) : 관리자, 0(false) : 일반회원
    authority : {
        type : Boolean,
        default : false
    },
    // 활성상태 1(true) : 활성, 0(false) : 비활성 -> 탈퇴처리
    state : {
        type : Boolean,
        default : true
    },
    // 가입상태 이메일인증완료 1(true), 이메일인증미완료 0(false)
    subscription_status : {
        type : Boolean,
        default : false
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


UserSchema.plugin( autoIncrement.plugin , {model : "user", field : "id", startAt : 1} );
module.exports = mongoose.model('user', UserSchema);


