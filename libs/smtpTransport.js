// 이메일 전송 시 필요한 관리자 메일 설정 파일
var nodemailer = require('nodemailer');
module.exports = nodemailer.createTransport({
        service: "Gmail",
        // 이메일 전송할 메일 설정 -> 추후 팝콘사 전체 계정으로 변경 예정
        auth: {
            // user: "hmkim@popcornsar.com",
            // pass: "popcornkelly1234"
            user: "jnkim@popcornsar.com",
            pass: "qowo351212!"
        }
});


