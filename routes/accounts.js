var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var geoip = require('geoip-lite');
var generator = require('generate-password'); // 랜덤 비밀번호 모듈
var moment = require('moment'); // 회원가입 후 7일 더하기를 위한 모듈
var csrf = require('csurf'); // csrf
var UserModel = require('../models/UserModel');
var LoginLogModel = require('../models/LoginLogModel');
var passwordHash = require('../libs/passwordHash');
var loginRequired = require('../libs/loginRequired');
var smtpTransport = require('../libs/smtpTransport');
var language = require('../libs/language'); // 다국어 설정 모듈


var rand, mailOptions, host, link;

var csrfProtection = csrf({ cookie: true }); // csrf 셋팅

passport.serializeUser(function (user, done) {
    console.log('serializeUser');
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    var result = user;
    result.password = "";
    console.log('deserializeUser');
    done(null, result);
});

passport.use(new LocalStrategy({
        usernameField: 'userid',
        passwordField : 'password',
        passReqToCallback : true

    }, 
    function (req, userid, password, done) {        
        UserModel.findOne({userid : userid , password : passwordHash(password)}, function (err,user) {
            if (!user){
                // done false -> 미들웨어 통과 못하게 막음
                return done(null, false, { message: language(req).login.CheckMessage});
            }else if (user.email_verification_state == false){
                req.session.userid=userid;          
                return done(null, false, { message : language(req).login.notEmailCheckMessage });     
            }else if (user.dormant_state == true){
                return done(null, false, { message : language(req).login.dormancyMessage });
            }else if (user.state == true){
                // 로그인 성공 시 // user session setting
                // 로그인 시 로그인 시간 저장                
                // 로그인로그 컬렉션에 아이디가 있으면 업데이트 처리, 없으면 추가 처리 
                LoginLogModel.findOne({userid : userid}, function(err, login_log) {
                    if (!login_log) {
                        var LoginLog = new LoginLogModel({
                        userid : userid,
                        login_at : Date.now(),
                        });
                        LoginLog.save(function(err) {
                            return done(null, user);
                        });  
                    } else {
                        var query = {
                            userid : userid,
                            login_at : Date.now()
                        };
                        LoginLogModel.update(
                            {userid : userid},
                            {$set : query},
                            function(err) {
                                return done(null, user);
                            }
                        );
                    }
                });                              
            }else{
                return done(null, false, { message: '탈퇴한 회원입니다.' });
            }
        });
    }
));


router.get('/', function(req, res){
    console.log('get: /account/ 라우터 호출');
    // 클라이언트 ip 통한 국가 체크
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    } console.log("client IP is *********************" + ip);
 
    var geo = geoip.lookup(ip);
    req.session.geo = geo;
    console.log('geo정보==>',geo);
    
    // 로그인 되어 있는 상태 -> workspace 페이지로 이동
    if(req.user) {
        res.send('<script>location.href="toolide/workspaceList";</script>');
        // res.render('toolide/workspace',{ language : language(req) });
        
    // 로그인 안되어 있는 상태 -> login 페이지로 이동
    }else{
        res.render('accounts/login', { flashMessage : req.flash().error , userid : req.session.userid, language : language(req) }); 
    }
    
});

router.post('/' , passport.authenticate('local', { 
    failureRedirect: '/', 
    failureFlash: true 
}),
function(req, res){
    res.send('<script>location.href="toolide/workspaceList";</script>');
}   
);


// 이메일(아이디) 중복체크
router.get('/checkuserid/:userid', function(req, res) {
    UserModel.findOne({userid: req.params.userid}, function(err,result) {
        if(result){
            res.json({ userExist : true });       
        }else{
            res.json({ userExist : false });
        }         
    });
});


// 닉네임 중복체크
router.get('/checkDisplayname/:displayname', function(req, res) {
    UserModel.findOne({displayname: req.params.displayname}, function(err,result) {
        if(result){
            res.json({ displaynameExist : true });       
        }else{
            res.json({ displaynameExist : false });
        }         
    });
});

// 해당 이메일 휴면계정 존재 여부 체크
router.get('/checkDormantAccount/:userid', function(req, res) {
    UserModel.findOne({userid: req.params.userid}, function(err,result) {
        if(result.dormant_state==true){
            res.json({ userExist : true });       
        }else{
            res.json({ userExist : false });
        }         
    });
});

// 회원가입 폼 페이지로 이동
router.get('/join', function(req, res) {
    res.render('accounts/join',{language : language(req)});
});

// test
router.get('/test', function(req, res) {
    res.render('accounts/joinSuccessEmailAlarm',{ language : language(req) });
});


// 회원가입
router.post('/join', function(req, res) {     
    var User = new UserModel({
        userid : req.body.userid,
        password : passwordHash(req.body.password),
        displayname : req.body.displayname,
        // ********테스트 종료 후 아래는 반드시 삭제할 것********
        // authority : 1,
        // ide_authority : true,
        // email_verification_state : true
    });
    User.save(function(err) {
       //res.send('<script>alert("회원가입 완료! 이메일 인증을 해주세요");location.href="/accounts/login";</script>');
       res.render('accounts/joinSuccessEmailAlarm',{ language : language(req) });
    });
});

// 인증 이메일 전송(nodemailer 모듈 사용) 
router.get('/send',function(req,res){
    rand=Math.floor((Math.random() * 100) + 54);
	host=req.get('host');
	link="http://"+req.get('host')+"/accounts/verify?id="+rand;
	mailOptions={
		to : req.query.to,
		subject : "Please confirm your Email account",
        html : "Hello,<br> Please Click on the link to verify your email before the request expires in 24 hours  ..<br><a href="+link+">\
                Click here to verify</a><br><br>PopcornSAR"	
	}
	console.log(mailOptions);
	smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.end("error");
        }else{
            res.end("sent");
        }
    });
});

// 이메일 인증 후 인증확인 페이지 및 DB Update
router.get('/verify',function(req,res){
    console.log(req.protocol+":/"+req.get('host'));
    if((req.protocol+"://"+req.get('host'))==("http://"+host)){
        console.log("Domain is matched. Information is from Authentic email");
        UserModel.findOne({ 'userid' : mailOptions.to }, function(err, result3) {
            if(result3){                
                // 현재시간
                var nowTime = moment(new Date()).format();
                console.log("현재시간====" + nowTime);
                // 가입시간
                var joinTime = moment(result3.created_at).format();
                console.log("가입시간====" + joinTime);                
                // 가입시간으로부터 24시간 지난 시간
                var afterTime = moment(joinTime).add(1, 'day').format();
                console.log("가입시간+7====" + afterTime);
                // 현재시간과 가입시간으로부터 24시간 지난 시간비교 (true or false 반환)
                // 현재시간이 가입시간으로부터 24시간 지난 시간보다 같거나 크면 true 반환
                var compareTime = nowTime >= afterTime;
                console.log("비교====" + compareTime);

                if( compareTime == true && result3.email_verification_state == false){
                    console.log('회원가입 후 24시간이 지나도록 인증을 하지않아 DB 삭제');
                    UserModel.remove({ 'userid' : mailOptions.to } , function(err) {
                        console.log('db 삭제');
                        res.end("<h1>The database has been deleted because it has not been verified for 24 hours</h1>");
                    });
                }else {
                    if(req.query.id==rand){
                        console.log("email is verified");            
                        UserModel.findOne({ 'userid' : mailOptions.to }, function(err, user){
                            var query = {
                                email_verification_state : true
                            };
                            UserModel.update(
                                {userid : mailOptions.to},
                                {$set : query},
                                function(err) {
                                    //res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");  
                                    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
                                    res.end('<script>alert("'+language(req).joinCompleted+'");location.href="/";</script>');   
                                }
                            );
                        });
                    } else {
                        console.log("email is not verified");
                        res.end("<h1>Bad Request</h1>");
                    }       
                }
            }else{
                console.log('결과값이 없습니다');
            }   
        });        
    }else{
        res.end("<h1>Request is from unknown source");
    }
});

// 비밀번호 재설정 페이지로 이동
router.get('/resetPasswordMail', function(req, res) {
    res.render('accounts/resetPasswordMail',{ language : language(req) });
});

// 비밀번호 재설정 이메일 전송(nodemailer 모듈 사용), 
router.get('/sendRandomPassword',function(req,res){     
    var random = generator.generate({
        length : 10,
        numbers : true
    });
    randomPassword = random;
	host=req.get('host');
    link="http://"+req.get('host')+"/";
	mailOptions={
		to : req.query.to,
		subject : language(req).findPassword.subject,
        html : language(req).findPassword.html  + randomPassword + "<br><a href="+link+"> <br>Login </a><br><br>PopcornSAR"	
	}
	console.log(mailOptions);
	smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.end("error");
        }else{
            UserModel.findOne({ 'userid' : req.query.to }, function(err, user){
                var query = {
                password : passwordHash(randomPassword),
                };
                UserModel.update(
                    {userid : req.query.to},
                    {$set : query},
                    function(err) {
                        res.end("sent");
                    }
                );
            });            
        }
    });
});

// 이메일 재전송 버튼 클릭 시 반환
router.get('/resendVerification/:userid', function(req, res) {
    // 로그인 시 입력한 userid을 session에 담아 이 값으로 회원정보를 검색
    UserModel.findOne({userid: req.session.userid}, function(err, result2) {
        if(result2){
            res.json({ resend : true });       
        }else{
            res.json({ resend : false });
        }   
    });
});

// 이메일 재전송 페이지 이동
router.get('/resendVerificationEmail', function(req, res){
    res.render('accounts/resendVerificationEmail', {userid : req.session.userid, language : language(req) });
});

// router.get('/login', function(req, res){
//     res.render('accounts/login', { flashMessage : req.flash().error , userid : req.session.userid});
// });

// router.post('/login' , passport.authenticate('local', { 
//         failureRedirect: '/accounts/login', 
//         failureFlash: true 
//     }),
//     function(req, res){
//         res.send('<script>location.href="/toolide/workspace";</script>');
//     }   
// );

router.get('/success', function(req, res){
    //req.user로 모든 정보를 받아올 수 있음 예) req.user.userid, req.user.id
    res.send(req.user);
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// 회원정보수정, 회원탈퇴시 현재 비밀번호 확인 (DB에 있는 현재 내 비밀번호 확인 후 새로운 비밀번호 설정 가능)
router.post('/checkPassword', function(req, res){
    var password = req.body.now_password;
    var password_hash = passwordHash(password);    
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        if(err) throw err;
        if(password_hash == user.password){        
            res.send(true);
        }else{
            res.send(false);  
        }
    });    
});

// 관리자 메인 페이지 이동
router.get('/myMainPage', function(req, res) {
    res.render('mypage/myMainPage',{language: language(req)});
});

// 회원정보 수정 페이지로 이동
router.get('/update/:id', loginRequired, function(req, res){
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        res.render('mypage/updateform', {req:req, user : user, language: language(req) });
    });    
});

// 회원정보 수정
router.post('/update/:id', loginRequired, function(req, res){
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        var query = {
            userid : req.body.userid,
            password : passwordHash(req.body.new_password),
            displayname : req.body.displayname
        };
        UserModel.update(
            {id : req.user.id},
            {$set : query},
            function(err) {
                var successMessage = language(req).memberInfomation.modify_SuccessMessage;
                console.log(successMessage);
                res.send('<script>alert(\"'+successMessage+'\"'+');location.href="/accounts/logout";</script>');
            }
        );
    });
});

// 회원 탈퇴 페이지
router.get('/withdraw/:id', loginRequired, function(req, res){
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        res.render('mypage/withdrawForm', {user : user, language : language(req) });
    });    
});

// 회원 탈퇴 (DB 삭제X, 비활성화)
router.post('/withdraw/:id', loginRequired, function(req, res) {
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        var query = {
            state : false,
            withdraw_at : Date.now()
        };
        UserModel.update(
            {id : req.user.id},
            {$set : query},
            function(err) {
                if(err) throw err;
                req.session.destroy(function(err) {
                    if(err) throw err;                    
                })
                    res.send('<script>alert("탈퇴되었습니다.");location.href="/";</script>');               
            }
        );
    });
});

// 휴면회원 해제 인증 절차 페이지
router.get('/releaseDormancyAccount', function(req, res) {
    res.render('accounts/releaseDormancyAccount',{ language : language(req) });
});

// 휴면회원 해제 인증 절차 처리
// 휴면회원 해제 인증 메일 전송
router.get('/sendDormancyVerification',function(req,res){
    rand=Math.floor((Math.random() * 100) + 54);
	host=req.get('host');
	link="http://"+req.get('host')+"/accounts/dormancyVerification?id="+rand;
	mailOptions={
		to : req.query.to,
		subject : "휴면 해제 인증 메일입니다.",
        html : "Hello,<br> Please Click on the link to verify your email ..<br><a href="+link+">\
                Click here to verify</a><br><br>PopcornSAR"	
	}
	console.log(mailOptions);
	smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.end("error");
        }else{
            res.end("sent");
        }
    });
});

// 휴면회원 해제 인증 절차 처리 
// 휴면회원 해제 인증 버튼 클릭 시 휴면 회원 해제 
router.get('/dormancyVerification', function(req, res) {
    console.log(req.protocol+":/"+req.get('host'));
    if((req.protocol+"://"+req.get('host'))==("http://"+host)) {
        console.log("Domain is matched. Information is from Authentic email");
        if(req.query.id==rand) {
            console.log("email is verified");
            console.log("메일" + mailOptions.to);
            // db 휴면회원 해제 처리
            UserModel.findOne({'userid' : mailOptions.to}, function(err, user) {
                console.log("메일" + user.userid);
                var query = {
                    dormant_state : false
                };
                UserModel.update(
                    {userid : mailOptions.to},
                    {$set : query},
                    function(err) {
                        res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");       
                    }
                );
            });
        } else {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    }
    else {
        res.end("<h1>Request is from unknown source");
    }
});


// Header의 Navbar를 통한 언어변경 (추후에 home.js로 이동)
router.post('/navbarLanguage', function(req,res){
    req.session.country =req.body.language;
    // console.log("랭귀지 데이터는??",req.body);
    res.json({message : "success"});
});

module.exports = router;