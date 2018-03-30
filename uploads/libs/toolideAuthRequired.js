module.exports = function(req, res, next) {
    if(req.user.ide_authority==false){
            console.log("ide권한"+req.user.ide_authority);
            res.render('toolide/ideAccessFailAlarm');
    }else{
        return next();
    }
    
};