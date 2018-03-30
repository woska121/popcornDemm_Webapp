var express = require('express');
var router = express.Router();
var CronJob = require('cron').CronJob;
var cmd=require('node-cmd');
var sprintf = require('sprintf-js').sprintf;
var en = require('../locales/en.json');

var ProductsModel = require('../models/ProductsModel');
var CommentsModel = require('../models/CommentsModel');
var CompanyQuoteModel = require('../models/CompanyQuoteModel');
var CompanyQuoteAnswerMailModel = require('../models/CompanyQuoteAnswerMailModel');
var CompanyModel = require('../models/CompanyModel');
var ToMemberMailModel = require('../models/ToMemberMailModel');
var UserModel = require('../models/UserModel');

var LoginLogModel = require('../models/LoginLogModel');
var loginRequired = require('../libs/loginRequired');
var adminRequired = require('../libs/adminRequired');
var smtpTransport = require('../libs/smtpTransport');
var passwordHash = require('../libs/passwordHash');
var language = require('../libs/language'); // 다국어 설정 모듈

var rand, mailOptions, host, link;

// 로그인 한지 1년 지난 회원 구하기를 위한 시간 모듈
var moment = require('moment');

// csrf 셋팅
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
router.get('/', function(req, res){
    // json으로 내보내고싶으면
    // res.json();
    res.send('admin app');
});


// 관리자 메인 페이지 이동
router.get('/adminMainPage',  adminRequired, function(req, res) {
    res.render('admin/adminMainPage',{ language : en });
});

// 관리자 기업 견적 문의 현황 조회
router.get('/companyQuoteState', adminRequired, function(req, res) {    
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    
    CompanyQuoteModel.count(function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        CompanyQuoteModel.find().sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, companyQuoteList) {
            if(err) throw err;
            res.render('admin/companyQuoteState', {companyQuoteList:companyQuoteList, curSet:curSet, startPage:startPage, endPage:endPage, 
                totalPage:totalPage, page:page, totalSet:totalSet, language : en });
        });   
    });
});

// 관리자 기업 견적 문의 답변 메일 전송 모달창
router.get('/findModal/:quoteObjId', adminRequired, function(req, res) {
    CompanyQuoteModel.findOne({ '_id' : req.params.quoteObjId }, function(err, result){ 
        if(result) {
            res.json({ result : result});
        }    
    });
});   

// 관리자 기업 견적 문의 답변 저장
router.post('/companyQuoteState', adminRequired, function(req, res) {    
    var companyQuoteAnswerMail = new CompanyQuoteAnswerMailModel({
        quote_answer_from : req.user.userid,
        quote_answer_to : req.body.quote_answer_to,
        quote_answer_title : req.body.quote_answer_title,
        quote_answer_content : req.body.quote_answer_content,
    });
    console.log(companyQuoteAnswerMail);
    // 견적문의 글 답변 내용 저장
    companyQuoteAnswerMail.save(function(err, companyQuoteAnswerMail) {
        // 견적 문의 글 답변여부 false -> true로 변경 
        CompanyQuoteModel.findOne({ '_id' : req.body.quote_objid }, function(err, quote){ 
            console.log(quote);
            var query = {
                answer_or_not : true
            };
            CompanyQuoteModel.update(
                {_id :  req.body.quote_objid},
                {$set : query},
                function(err) {
                    if(err) throw err;
                    res.send('<script>alert("견적문의 답변 완료");location.href="/admin/companyQuoteState";</script>');
                }
            );
        });       
    }); 
});

// 관리자 기업 견적 문의 답변 메일 전송
router.get('/companyQuoteAnswerMail', adminRequired, function(req,res){
	mailOptions={
		to : req.query.to,
		subject : req.query.title,
        html : req.query.content
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

// 기업회원관리 - 기업회원조회
router.get('/companyManage', adminRequired, function(req, res) {
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    

    CompanyModel.count(function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        CompanyModel.find().sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, company) {
            if(err) throw err;
            res.render('admin/companyManage', {company : company, curSet:curSet, startPage:startPage, endPage:endPage, 
                totalPage:totalPage, page:page, totalSet:totalSet, language : en });
        });   
    });  
});

// 기업회원관리 - 기업회원추가 
router.post('/companyManage', adminRequired, function(req, res) {
    console.log("작성자" + req.user.userid);
    var company = new CompanyModel({
        add_company_writer : req.user.userid,        
        company_name : req.body.company_name,
        manager_name : req.body.manager_name,
        manager_department : req.body.manager_department,
        manager_email : req.body.manager_email,
        manager_tel : req.body.manager_tel,
        manager_title : req.body.manager_title,
        company_note : req.body.company_note
    });
    company.save(function(err) {
        res.send('<script>alert("기업 회원 등록 완료");location.href="/admin/CompanyManage";</script>');
    });
});

// 기업회원관리 - 상세보기 
router.post('/detailCompany/:companyObjId', adminRequired, function(req, res) {
    CompanyModel.findOne({'_id' : req.params.companyObjId},function(err, company) {
        if(err){
            console.log(err);
        }else{
            res.json({ company : company});
        }        
    });    
});

// 기업회원관리 - 기업회원수정
router.post('/updateCompany', adminRequired, function(req, res) {
    CompanyModel.findOne({'_id' : req.body.companyObjId}, function(err, company) {
        var query = {
            add_company_writer : req.user.userid,        
            company_name : req.body.company_name,
            manager_name : req.body.manager_name,
            manager_department : req.body.manager_department,
            manager_email : req.body.manager_email,
            manager_tel : req.body.manager_tel,
            manager_title : req.body.manager_title,
            company_note : req.body.company_note
        };
        CompanyModel.update(
            {_id :  req.body.companyObjId},
            {$set : query},
            function(err) {
                res.send('<script>alert("기업 회원 수정 성공");location.href="/admin/companyManage";</script>');
            }
        );
    });
});

// 기업회원관리 - 기업회원삭제
router.post('/deleteCompany', adminRequired, function(req, res){
    CompanyModel.remove({ '_id' : req.body.companyObjId }, function(err){
        res.json({messsage : "success"});
    });
});

// 전체회원조회
router.get('/memberCheck', adminRequired, function(req, res){
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    
    UserModel.count({'authority' : 0, 'state' : true}, function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        UserModel.find({'authority' : 0, 'state' : true}).sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, user) {
            if(err) throw err;
            res.render('admin/memberCheckPage', {user : user, curSet:curSet, startPage:startPage, endPage:endPage, 
                totalPage:totalPage, page:page, totalSet:totalSet, language : en });
        });   
    });
});

//  전체회원조회 - 회원등록 알림 이메일 전송
router.get('/sendEmailToRegisterMember',function(req,res){     
    host=req.get('host');
    to=req.query.to;
    temporary_password=req.query.password;
    link="http://"+req.get('host')+"/accounts/login";
	mailOptions={
        to : req.query.to,
		subject : "팝콘사 회원 등록되었습니다.",
        html : "안녕하세요 팝콘사 홈페이지에 회원 등록되었습니다.<br>\
                관리자가 임시 입력한 회원님의 비밀번호는 다음과 같습니다.<br>\
                로그인 후 임시비밀번호를 반드시 변경하시기 바랍니다.<br>\
                회원님의 아이디 : " + to + " <br>\
                임시비밀번호 :"  + temporary_password + "<br><a href="+link+"> <br>\
                Login하러가기 </a><br><br>PopcornSAR"	
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

// 전체회원조회 - 회원등록
router.post('/registerMember', adminRequired, function(req, res) {
    var User = new UserModel({
        userid : req.body.userid,
        displayname : req.body.displayname,
        password : passwordHash(req.body.password),        
        company_name : req.body.company_name,
        admin_register : true,
        email_verification_state : true
    });
    User.save(function(err) {
        res.send('<script>alert("회원 등록 완료!");location.href="/admin/memberCheck";</script>');
    });
});

// 회원전체조회 - 휴면 회원 페이지에서 메일전송
router.get('/mailToMember', adminRequired, function(req,res){
	mailOptions={
		to : req.query.to,
		subject : req.query.title,
        html : req.query.content
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

// 전체회원조회 - 회원에게 보낸 메일 저장
router.post('/memberCheck', adminRequired, function(req, res) {    
    var toMemberMailModel = new ToMemberMailModel({
        send_from : req.user.userid,
        send_to : req.body.send_to,
        send_title : req.body.send_title,
        send_content : req.body.send_content,
    });
    console.log(toMemberMailModel);
    toMemberMailModel.save(function(err, toMemberMailModel) {       
         res.send('<script>alert("메일 전송 완료");location.href="/admin/memberCheck";</script>');
    });
});


// 전체회원조회 - ide권한 부여
router.post('/ideAuthorizeMember/:userid', adminRequired, function(req, res){
    UserModel.findOne({'userid' : req.params.userid}, function(err, user) {
        var query = {
            ide_authority : true
        };
        UserModel.update(
            {userid :  req.params.userid},
            {$set : query},
            function(err) {
                if(err){
                    console.log(err);
                    res.end("error");
                }else{
                    res.end("sent");
                }
            }
        );        
    });
});

// 전체회원조회 - ide권한 부여 취소
router.post('/cancelIdeAuthorizeMember/:userid', adminRequired, function(req, res){
    UserModel.findOne({'userid' : req.params.userid}, function(err, user) {
        var query = {
            ide_authority : false
        };
        UserModel.update(
            {userid :  req.params.userid},
            {$set : query},
            function(err) {
                if(err){
                    console.log(err);
                    res.end("error");
                }else{
                    res.end("sent");
                }
            }
        );        
    });
});

// 관리자 권한 부여
// 관리자 메일 전송 -> 수락 해야 관리자권한으로 변경되도록.
router.post('/sendAddAdminAuthEmail', adminRequired, function(req, res) {
    rand=Math.floor((Math.random() * 100) + 64);
	host=req.get('host');
    link="http://"+req.get('host')+"/admin/addAdminAuthEmail?id="+rand;
    mailOptions = {
        to : req.body.userId,
        subject : "팝콘사 홈페이지 관리자 권한 인증 메일입니다.",
        html : "안녕하세요. <br> 아래 링크를 클릭하시면 팝콘사 홈페이지 관리자 권한이 부여됩니다.<br>\
        <a href="+link+">인증하려면 클릭하세요!</a><br><br>PopcornSAR"
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function(error, response) {
        if(error) {
            console.log(error);
            res.end("error");
        } else {   
            res.end("sent")
        }
    });
});

// 관리자 메일 전송 인증 시 DB Update
router.get('/addAdminAuthEmail', function(req, res) {
    console.log(req.protocol+":/"+req.get('host'));
    if((req.protocol+"://"+req.get('host'))==("http://"+host)){
	    console.log("Domain is matched. Information is from Authentic email");
        if(req.query.id == rand){
            console.log("email is verified");
            var to = mailOptions.to;
            UserModel.findOne({ 'userid' : to }, function(err, user) {
                console.log("user===" + user);
                var query = {
                    authority : 2
                };
                UserModel.update(
                    {userid : to},
                    {$set : query},
                    function(err) {
                       if(err) throw err; 
                       res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
                       res.end('<script>alert("관리자 권한 인증 완료되었습니다.");location.href="/";</script>');   
                    }                    
                );
            });           
        } else{
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    }else{
        res.end("<h1>Request is from unknown source");
    }
});


// 관리자 조회
router.get('/adminCheck', adminRequired, function(req, res){
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    
    UserModel.count({'authority' : 2}, function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        UserModel.find({'authority' : 2}).sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, user) {
            if(err) throw err;
            res.render('admin/adminCheckPage', {user : user, curSet:curSet, startPage:startPage, endPage:endPage, 
                totalPage:totalPage, page:page, totalSet:totalSet, language : en });
        });   
    });
});


// 관리자 권한 해제
router.post('/cancelAdminAuth/:userid', adminRequired, function(req, res) {
    UserModel.findOne({'userid' : req.params.userid}, function(err, user) {
        var query = {
            authority : 0
        };
        UserModel.update(
            {userid :  req.params.userid},
            {$set : query},
            function(err) {
                if(err){
                    console.log(err);
                    res.end("error");
                }else{
                    res.end("sent");
                }
            }
        );        
    });
});

// 회원 excel import -> User DB 저장
router.get('/csvImportMember', adminRequired, function(req, res) {
    var uploadFile = req.query.uploadFile;  
    console.log(uploadFile);
    var command = sprintf(` cd /mongodb/bin & mongoimport --db example --collection ex --type csv --headerline --file %s`, uploadFile);
    cmd.get(command, 
        function(err, data, stderr){
            if(err) {
                console.log(err);
                res.end("error");
            } else {
                res.end("sent");
            }
        }
    );
});

// 전체회원조회 - 강제 탈퇴 처리(비활성화)
router.post('/forcedWithdrawMember/:userid', adminRequired, function(req, res) {
    UserModel.findOne({'userid' : req.params.userid}, function(err, user) {
        // 탈퇴 db update
        var query = {
            state : false
        };
        UserModel.update(
            {userid :  req.params.userid},
            {$set : query},
            function(err) {
                if(err){
                    console.log(err);
                    res.end("error");
                }else{
                    res.end("sent");
                }
            }
        );
    });
});




// 회원가입 시 전송되는 인증 이메일 미인증 회원 조회
router.get('/emailNotVerificationMember', adminRequired, function(req, res) {
     // page : 현재 페이지
     var page = req.param('page');
     if(page == null) {
         page = 1;
     }    
     UserModel.count({'email_verification_state' : false}, function(err, totalCount){
         if(err) throw err;        
         var maxPageInSet = 5,   //페이지 카운트 갯수
             maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
             skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
             totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
             totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
             curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
             startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
             endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 
 
         UserModel.find({'email_verification_state' : false}).sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, user) {
             if(err) throw err;
             res.render('admin/emailNotVerificationMember', {user : user, curSet:curSet, startPage:startPage, endPage:endPage, totalPage:totalPage, page:page, totalSet:totalSet});
         });   
     });  
});

// 탈퇴회원관리 - 탈퇴회원 조회
router.get('/withdrawMemberManage', adminRequired, function(req, res) {
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    
    UserModel.count({'authority' : 0}, function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        UserModel.find({'authority' : 0, 'state' : false}).sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, user) {
            if(err) throw err;
            res.render('admin/withdrawMemberManage', {
                user : user, 
                curSet : curSet, 
                startPage : startPage, 
                endPage : endPage, 
                totalPage : totalPage, 
                page : page, 
                totalSet : totalSet,
                language : en
            });
        });   
    });
});

// 탈퇴회원관리 - 탈퇴 취소 처리(재활성화)
router.post('/cancelWithdrawMember/:userid', adminRequired, function(req, res) {
    UserModel.find({'userid' : req.params.userid}, function(err, user) {
        // 활성화 db update
        var query = {
            state : true
        };
        UserModel.update(
            {userid :  req.params.userid},
            {$set : query},
            function(err) {
                if(err){
                    console.log(err);
                    res.end("error");
                }else{
                    res.end("sent");
                }
            }
        );
    });
});

/*
// 휴면 계정 처리 및 휴면 전환 1개월 전인 회원 대상으로 알림 메일 발송 
// **cron 사용 -> Unix 기반 운영 체제의 시간 기반 Job Scheduler. 정해진 날짜, 주기적 간격으로 스케쥴링 가능
var job = new CronJob({
/*  매일 자정 스케줄링 시 
cronTime: '0 0 * * *',      
//  test 매분마다 스케줄링
cronTime: '* * * * *',
onTick: function() {
    UserModel.find({'authority' : false}, function(req, uresult) {        
        for(var i=0; i<uresult.length; i++) {
            if (uresult[i].userid.indexOf("fb_")==0 || uresult[i].userid.indexOf("g_")==0 || uresult[i].userid.indexOf("git_")==0){
                console.log(uresult[i].userid + "계정 연동 회원가입 회원으로 휴면처리 어려움");
            } else {
                // 메일 인증 안한 회원이거나 탈퇴 회원에 대해서는 휴면 처리 필요없음 처리
                if (uresult[i].state==false || uresult[i].email_verification_state==false) {
                    console.log("탈퇴회원이거나 메일 인증 안한 회원이므로 휴면 처리 필요 없음");
                }else{
                    console.log("uresult====" + uresult);
                    var userid = uresult[i].userid;
                    var joinTime = moment(uresult[i].created_at).format();
                    var now = moment(new Date()).format();
                    var originalDormantDate = uresult[i].dormant_date;
                    var dormantDate = moment(originalDormantDate).format();
                    var dormantMailSend = uresult[i].dormant_mail_send;
                    var dormantState = uresult[i].dormant_state;
                    console.log("userid=====" + userid);
                    
                    // 휴면상태가 아닌 고객일 경우 검사 시작
                    if(dormantState == false){
                        console.log (userid + " 여기까지옴 " + dormantState);
                        LoginLogModel.findOne({'userid' : userid}, function(req, lresult) {                   
                            console.log("login log result==" + lresult);                    
                            if (lresult) {   // LoginLogModel에 있는 회원(회원가입 후 한번이라도 로그인 한 회원)
                                // 최종 로그인 시간 
                                var lastLoginTime = moment(lresult.login_at).format();      
                                console.log("최종 로그인 시간==" + lastLoginTime);                                                                         
                                // 휴면 계정 전환 일자 (최종 로그인 시간 + 1년) 
                                //var yearLaterTime = moment(lastLoginTime).add(1, 'year').format();
                                //test 
                                //var yearLaterTime = moment(lresult[i].dormant_date).format();
                                var yearLaterTime = moment(lastLoginTime).add(1, 'days').format();
                                console.log("로그인 시간 +1년==="+ yearLaterTime);     
                                // LoginLogModel에 해당 userid의 dormant_date에 yearLaterTime 저장
                                console.log("originalDormantDate==="+originalDormantDate);
                                if(originalDormantDate == undefined) { //dormant_date값 없는 userid의 경우 update 해주기
                                    var query = {
                                        userid : lresult.userid,
                                        dormant_date : yearLaterTime,
                                    };
                                    UserModel.update(
                                        {userid : lresult.userid},
                                        {$set : query},
                                        function(err) {
                                        console.log("휴면 전환 예정일 db 업데이트 완료");
                                        }
                                    );                  
                                } else {
                                    console.log("이미 휴면 전환 예정일 업데이트됨");
                                }              
                            } else {   // UserModel에는 있으나 LoginLogModel에는 없는 회원 처리 (회원가입 후 한번도 로그인 안한 회원)
                                console.log("originalDormantDate===" + originalDormantDate + userid);
                                if(originalDormantDate == null) {
                                // 휴면 계정 전환 일자(해당 아이디 회원의 회원가입 후 1년이 지난 시간) 
                                // var joinYearLaterTime = moment(joinTime).add(1, 'year').format();
                                // test
                                var joinYearLaterTime = moment(joinTime).add(1, 'days').format();
                                console.log("joinYearLaterTime====" + joinYearLaterTime);
                                console.log("userid는====" + userid);
                                    var query = {
                                        userid : userid,
                                        dormant_date : joinYearLaterTime,
                                    };
                                    UserModel.update(
                                        {userid : userid},
                                        {$set : query},
                                        function(err) {
                                        console.log("회원가입 후 한번도 로그인 안 한 회원 휴면 전환 예정일 db 업데이트 완료");
                                        }
                                    );             
                                } else {
                                    console.log("이미 dormant date db에 저장되어있음");
                                }
                            }
                                        
                        // 휴면 계정 전환 일자와 현재 시간 비교 (true, false 반환)
                        console.log("dormant_date====" + dormantDate);
                        console.log("now======" + now);
                        var compareYearLaterTime = now >= originalDormantDate;
                        console.log("compareYearLaterTime===" + compareYearLaterTime);
                        if(compareYearLaterTime == false) { // 휴면 계정 전환 일자가 현재 시간 미만일 경우(아직 휴면 계정 전환 일자 아닐때)
                            if (dormantMailSend == false){ // 그중에서도 휴면 전환 알림 메일 안받은 회원일 경우
                                var todayDate = moment(new Date()).format('YYYYMMDD');
                                console.log("todayDate==" + todayDate);
                                // 최종 로그인 시간으로부터 1년이 경과하기 한달 전 날짜 
                                //var monthAgoDate = moment(yearLaterDate).subtract(1, 'month').format('YYYYMMDD');
                                // test
                                var monthAgoDate = moment(originalDormantDate).add(-1, 'minutes').format('YYYYMMDD');
                                console.log("monthAgoDate==" + monthAgoDate);
                                // monthAgoTime 과 현재 시간 비교
                                var compareMonthAgoDate = todayDate == monthAgoDate;
                                console.log("compareMonthAgoDate==" + compareMonthAgoDate);            
                                if(compareMonthAgoDate == true) {   // 휴면 계정 전환 일자가 아닌 회원 중 전환 일자가 1개월 남은 회원 대상
                                    console.log("휴면 전환 알림 이메일 보내기 시작");
                                    date = originalDormantDate;
                                    mailOptions={
                                        to : userid,
                                        subject : "팝콘사 아이디가 휴면상태로 전환됩니다.",
                                        html : "안녕하세요 회원님!<br>\
                                        최근 1년간 팝콘사에 로그인하신 기록이 없어 회원님의 아이디가 휴면상태로 전환될 예정입니다.<br>\
                                        서비스 장기 미사용에 따른 개인정보 별도 보관 및 그에 따른 휴면전환은 관련 법령(정보통신망 이용촉진 및 정보보호 등에 관한 법률 제 29조, 동법 시행령 제 16조)에 따른 조치입니다.<br>\
                                        해당 법령에 따라 별도 보관된 개인정보는 그 이용 및 제공이 제한됩니다. 이에 따라, 휴면 아이디의 서비스가 제한되니 참고하시기 바랍니다.<br>\
                                        회원님의 휴면 전환 예정일은 다음과 같습니다. <br> \
                                        휴면 전환 예정일  : " + date + " <br>\
                                        휴면처리를 원하지 않으시면 해당 기간 내 로그인 해주시기 바랍니다.<br>\
                                        팝콘사를 이용해 주셔서 감사합니다.<br>\
                                        더욱 편리한 서비스를 제공하기 위해 항상 최선을 다하겠습니다."
                                    }
                                    console.log("mail send OK!");
                                    smtpTransport.sendMail(mailOptions, function(error, response){
                                        if(error){
                                            console.log(error);
                                        }else{
                                            var query = {
                                                userid : userid,
                                                dormant_mail_send : true
                                            };
                                            UserModel.update(
                                                {userid : userid},
                                                {$set : query},
                                                function(err) {
                                                console.log("휴면 알림 메일 전송 컬럼 업데이트 완료");
                                                }
                                            );
                                        }
                                        smtpTransport.close();
                                    });
                                } else {
                                    console.log("휴면 전환 알림 이메일 보낼 회원 없음!");
                                }
                            } else {
                                console.log("휴면 전환 알림 이메일 이미 보냄!");
                            }   
                        } else { // 휴면 계정 전환 일과 현재 시간이 같거나 초과되었을 때 -> **휴면 전환 대상 : 휴면처리해주기**
                            var query = {
                                userid : userid,
                                dormant_state : true
                            };
                            UserModel.update(
                                {userid : userid},
                                {$set : query},
                                function(err) {
                                    console.log("해당 아이디 휴면전환 완료");
                                }
                            );
                        }
                    });              
                    } else {  // dormant_state가 true인 회원(휴면 회원)
                        console.log("이미 휴면 처리 된 회원");
                    }            
                }
            }
        }
    });        
},
start: false,
timeZone: 'Asia/Seoul'
});
job.start();
*/


// 휴면회원관리 - 휴면회원 조회 
router.get('/dormancyMemberManage', adminRequired, function(req, res) {
    // page : 현재 페이지
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }    
   UserModel.count({'authority' : 0}, function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        UserModel.find({'authority' : 0, 'dormant_state' : true}).sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, final_result) {
            if(err) throw err;
            res.render('admin/dormancyMemberManage', {
                final_result : final_result, 
                curSet : curSet, 
                startPage : startPage, 
                endPage : endPage, 
                totalPage : totalPage,
                page : page,
                totalSet : totalSet,
                language : en });
        });   
    });    
});

// 휴면회원관리 - 휴면회원에게 보낸 메일 저장 (휴면회원조회)
router.post('/dormancyMemberManage', adminRequired, function(req, res) {    
    var toMemberMailModel = new ToMemberMailModel({
        send_from : req.user.userid,
        send_to : req.body.send_to,
        send_title : req.body.send_title,
        send_content : req.body.send_content,
    });
    console.log(toMemberMailModel);
    toMemberMailModel.save(function(err, toMemberMailModel) {       
         res.send('<script>alert("메일 전송 완료");location.href="/admin/dormancyMemberManage";</script>');
    });
});


module.exports = router;
