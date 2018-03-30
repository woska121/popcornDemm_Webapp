var crypto = require('crypto');
var mysalt = "fastcampus";

// Hash는 단방향 암호화, 결과로 나온 값을 이용하여 원본 추출 불가
module.exports = function(password){
    return crypto.createHash('sha512').update( password + mysalt).digest('base64');
};