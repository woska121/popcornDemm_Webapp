var express = require('express');
var router = express.Router();
var UserModel = require('../models/UserModel');
var passwordHash = require('../libs/passwordHash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var loginRequired = require('../libs/loginRequired');
var smtpTransport = require('../libs/smtpTransport');

var rand, mailOptions, host, link;

// 랜덤 비밀번호 모듈
var generator = require('generate-password');

// 회원가입 후 7일 더하기를 위한 모듈
var moment = require('moment');

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
                return done(null, false, { message: '아이디 또는 비밀번호 오류 입니다.' });
            }else if (user.subscription_status == false){
                req.session.userid=userid;
                return done(null, false, { message: '이메일 인증이 안된 회원입니다.' });     
            }else if (user.state == true){
                // 로그인 성공 시
                // user session setting
                return done(null, user);
            }else{
                return done(null, false, { message: '탈퇴한 회원입니다.' });
            }
        });
    }
));

router.get('/', function(req, res){
    res.send('account app');
});

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

// 회원가입 폼 페이지로 이동
router.get('/join', function(req, res) {
    res.render('accounts/join');
});

// 회원가입
router.post('/join', function(req, res) {     
    var User = new UserModel({
        userid : req.body.userid,
        password : passwordHash(req.body.password),
        displayname : req.body.displayname
    });
    User.save(function(err) {
       res.send('<script>alert("회원가입 완료! 이메일 인증을 해주세요");location.href="/accounts/login";</script>');
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
        html : "Hello,<br> Please Click on the link to verify your email before the request expires in 7days  ..<br><a href="+link+">\
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
                // 가입시간으로부터 7일 지난 시간
                var afterTime = moment(joinTime).add(7, 'day').format();
                console.log("가입시간+7====" + afterTime);
                // 현재시간과 가입시간으로부터 7일 지난 시간비교 (true or false 반환)
                // 현재시간이 가입시간으로부터 7일 지난 시간보다 같거나 크면 true 반환
                var compareTime = nowTime >= afterTime;
                console.log("비교====" + compareTime);

                if( compareTime == true && result3.subscription_status == false){
                    console.log('회원가입 후 7일이 지나도록 인증을 하지않아 DB 삭제');
                    UserModel.remove({ 'userid' : mailOptions.to } , function(err) {
                        console.log('db 삭제');
                        res.end("<h1>The database has been deleted because it has not been verified for 7 days</h1>");
                    });
                }else {
                    if(req.query.id==rand){
                        console.log("email is verified");            
                        UserModel.findOne({ 'userid' : mailOptions.to }, function(err, user){
                            var query = {
                                subscription_status : true
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
    res.render('accounts/resetPasswordMail');
});

// 비밀번호 재전송 이메일 전송(nodemailer 모듈 사용), 
router.get('/sendRandomPassword',function(req,res){     
    var random = generator.generate({
        length : 10,
        numbers : true
    });
    randomPassword = random;
	host=req.get('host');
    link="http://"+req.get('host')+"/accounts/login";
	mailOptions={
		to : req.query.to,
		subject : "팝콘사 - 임시 비밀번호입니다.",
        html : "아래와 같이 요청하신 임시비밀번호가 발급되었습니다.<br> 로그인 후 임시비밀번호를 반드시 변경하시기 바랍니다.  ..<br>\
                <br> 임시비밀번호 :"  + randomPassword + "<br><a href="+link+"> <br>Login </a><br><br>PopcornSAR"	
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
router.get('/reverify/:userid', function(req, res) {
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
router.get('/resendEmail', function(req, res){
    res.render('accounts/resendEmail', {userid : req.session.userid});
});

router.get('/login', function(req, res){
    res.render('accounts/login', { flashMessage : req.flash().error , userid : req.session.userid});
});

router.post('/login' , passport.authenticate('local', { 
        failureRedirect: '/accounts/login', 
        failureFlash: true 
    }),
    function(req, res){
        res.send('<script>alert("로그인 성공");location.href="/";</script>');
    }   
);

router.get('/success', function(req, res){
    //req.user로 모든 정보를 받아올 수 있음 예) req.user.userid, req.user.id
    res.send(req.user);
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/accounts/login');
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

// 회원정보 수정 페이지로 이동
router.get('/update/:id', loginRequired, function(req, res){
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        res.render('accounts/updateForm', {user : user});
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
                res.send('<script>alert("회원 정보 수정 성공");location.href="/accounts/logout";</script>');
            }
        );
    });
});

// 회원 탈퇴 페이지
router.get('/withdraw/:id', loginRequired, function(req, res){
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        res.render('accounts/withdrawForm', {user : user});
    });    
});

// 회원 탈퇴 (DB 삭제X, 비활성화)
router.post('/withdraw/:id', loginRequired, function(req, res) {
    UserModel.findOne({ 'id' : req.user.id }, function(err, user){
        var query = {
            state : false
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

module.exports = router;