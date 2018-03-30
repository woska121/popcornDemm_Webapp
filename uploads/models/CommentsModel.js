var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var CommentsSchema = new Schema({
    content : String,
    created_at : {
        type : Date,    //작성날짜의 데이터타입
        default : Date.now() //작성날짜
    },
    board_id : Number,
    userid : String
});

CommentsSchema.plugin( autoIncrement.plugin , { model: "comments", field : "id", startAt : 1 });
module.exports = mongoose.model( "comments", CommentsSchema);