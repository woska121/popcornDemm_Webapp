// 미들웨어
// 글 작성 시 또는 글 수정 시 login 안되잇으면 login page로 이동
module.exports = function(req, res, next) {

    if (!req.isAuthenticated()) {
        res.redirect('/accounts/login');
    }else{
        // 다음으로 제어권을 넘긴다
        return next();
    }

};