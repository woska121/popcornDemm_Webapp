var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

// 로그인시마다 저장되는 로그 + 휴면처리관련 컬렉션
var LoginLogSchema = new Schema({
    userid : {  // 사용자 ID
        type : String,
        required : true
    },
    login_at : {  // 로그인 시간
        type : Date
    },
    compare_time : { //최종 로그인 시간 + 3개월보다 현재 시간이 더 지났을 때 true, false 
        type : Boolean,
        default : false
    },
    user : {
        type : Schema.Types.ObjectId,
        ref : 'user'
    }
});

LoginLogSchema.virtual('getDate').get(function() {
    var date = new Date(this.login_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate(),
        hour : date.getHours(),
        minutes : date.getMinutes()
    };
});

LoginLogSchema.plugin( autoIncrement.plugin , {model : "loginlog", field : "id", startAt : 1} );
module.exports = mongoose.model('loginlog', LoginLogSchema);