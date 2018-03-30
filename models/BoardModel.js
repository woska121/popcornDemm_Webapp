var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

// 생성될 필드명을 정한다.
var BoardSchema = new Schema({
    board_title : {
        type : String, // 게시물 제목
        required : [true, '제목은 입력해주세요']
    },

    board_image : String, // 이미지 파일명
    board_content : String, // 게시물 내용
    board_created_at : { // 작성일
        type : Date,
        default : Date.now()
    },
    userid : String, // 작성자 추가
    hit : {
        type : Number,
        default : 0
    }
});

BoardSchema.virtual('getDate').get(function() {
    var date = new Date(this.board_created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

BoardSchema.plugin( autoIncrement.plugin , { model : 'boards' , field : 'id' , startAt : 1 });
module.exports = mongoose.model('boards', BoardSchema);