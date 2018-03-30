var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var PromotioncodeUse = new Schema({
    promotioncode : {type : String, required: true }, // 프로모션 코드
    userid : {type : String, required: true },  // 프로모션 코드 사용자 id
    usecode_at : {  // 프로모션 코드 사용 날짜
        type : Date,
        default : Date.now()
    }
});

PromotioncodeUse.virtual('getDate').get(function(){
    var date = new Date(this.usecode_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

PromotioncodeUse.plugin(autoIncrement.plugin, {model : 'promotioncodeUse', field : 'id', startAt : 1});
module.exports = mongoose.model('promotioncodeUse', PromotioncodeUse);
