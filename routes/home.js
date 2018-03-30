var express = require('express');
var router = express.Router();
var ProductsModel = require('../models/ProductsModel');
var socket = require('socket.io');
var geoip = require('geoip-lite');

var kr = require('../locales/kr.json');
var en = require('../locales/en.json');
var jp = require('../locales/jp.json');

/* GET home page. */
router.get('/', function (req, res) {

    // ProductsModel.find(function (err, products) { //첫번째 인자는 err, 두번째는 받을 변수명
        
    // });

    //  클라이언트 ip 통한 국가 체크
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }console.log("client IP is *********************" + ip);

    var geo = geoip.lookup(ip);
    console.log(geo);

    if (geo === null){
        res.render('home',{ kr:kr } ); // DB에서 받은 products를 products변수명으로 내보냄
    }


 });

module.exports = router;