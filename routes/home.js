var express = require('express');
var router = express.Router();
var socket = require('socket.io');
var geoip = require('geoip-lite');

/* GET home page. */
router.get('/', function (req, res) {

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

    res.render('accounts/login', { flashMessage : req.flash().error , userid : req.session.userid});

 });



module.exports = router;