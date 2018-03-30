var express= require('express');
var router = express.Router();
var toolideAuthRequired = require('../libs/toolideAuthRequired');
var loginRequired = require('../libs/loginRequired');

router.get('/',function(req,res){
    res.send('toolide app');
});

router.get('/workspace', loginRequired, toolideAuthRequired, function(req,res){
    res.render('toolide/workspace');
});

module.exports=router;

