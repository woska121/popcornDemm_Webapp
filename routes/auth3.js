// 깃허브 계정 연동 회원가입 및 로그인 
var express = require('express');
var router = express.Router();
var UserModel = require('../models/UserModel');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GitHubStrategy({
        clientID: "6453e899389f28961eea", //앱 ID 입력하세요
        clientSecret: "2d7de3f4215a3b2ee9384ae1fe4b034333d93fc7", // 앱 시크릿 코드 입력하세요.
        callbackURL: "http://localhost:3000/auth3/github/callback",
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        UserModel.findOne({ userid : "git_" + profile.id }, function(err, user){
            if(!user){  //없으면 회원가입 후 로그인 성공페이지 이동
                var regData = { //DB에 등록 및 세션에 등록될 데이터
                    userid :  "git_" + profile.id,
                    password : "github_login",
                    displayname : profile.displayName,
                    email_verification_state : true
                };
                var User = new UserModel(regData);
                User.save(function(err){ //DB저장
                    done(null,regData); //세션 등록
                });
            }else{ //있으면 DB에서 가져와서 세션등록
                done(null,user);
            }

        });
    }
));

// 깃허브 인증링크 생성
router.get('/github', passport.authenticate('github', { scope: ['email']}) );


//인증후 깃허브에서 이 주소로 리턴해줌. 상단에 적은 callbackURL과 일치
router.get('/github/callback',
    passport.authenticate('github', 
        { 
            // 깃허브 로그인 후 /로 리다이렉팅 하도록 설정
            successRedirect: '/',
            failureRedirect: '/auth3/github/fail' 
        }
    )
);

//로그인 성공시 이동할 주소
router.get('/github/success', function(req,res){
    res.send(req.user);
});

router.get('/github/fail', function(req,res){
    res.send('github login fail');
});

module.exports = router;