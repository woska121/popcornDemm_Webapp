
var kr = require('../locales/kr.json');
var en = require('../locales/en.json');
var jp = require('../locales/jp.json');

var language;

module.exports = function (req){
    var geo = req.session.geo;
    
    if (req.session.country === null && geo === null){ //localtest
        req.session.country = 'JP';
    } else if(req.session.country === null && geo !== null) {
        req.session.country = geo.country;
    } 

    // session에 언어설정이 되어있는 경우
    console.log('language.js 모듈 실행--->',req.session.country); // 변환정상작동 테스트
    switch(req.session.country){
        case 'KR' : language = kr; console.log('한국어설정'); return language;
        case 'EN' : language = en; console.log('영어설정'); return language;
        case 'JP' : language = jp; console.log('일본어설정'); return language;
        default : language = jp; return language;
    }
}