var express= require('express');
var router = express.Router();


router.get('/',function(req,res){
    res.send('toolide app');
});


module.exports=router;

