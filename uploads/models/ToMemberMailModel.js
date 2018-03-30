var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var ToMemberMailSchema = new Schema({
    send_from : {
        type : String, // 회원에게 메일 보낸 관리자 
        required : true
    },
    send_to : {
        type : String, // 이메일 보낸 회원 
        required : true
    },
    send_title : { // 제목
        type : String,
        required : true
    },
    send_content : { // 내용
        type : String,
        required : true
    },
    send_at : {  // 이메일 전송 시간 
        type : Date,
        default : Date.now()
    },
    
});

ToMemberMailSchema.virtual('getDate').get(function() {
    var date = new Date(this.send_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});


ToMemberMailSchema.plugin( autoIncrement.plugin , {model : "tomembermail", field : "id", startAt : 1} );
module.exports = mongoose.model('tomembermail', ToMemberMailSchema);