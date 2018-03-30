module.exports = function(req, res, next) {
    if (!req.isAuthenticated()){ 
        res.redirect('/');
    }else{
        if(req.user.authority==0){
            res.send('<script>alert("관리자만 접근가능합니다.");location.href="/";</script>');
        }else{
            return next();
        }
    }
};