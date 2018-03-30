var express = require('express');
var router = express.Router();
var ProductsModel = require('../models/ProductsModel');
var CommentsModel = require('../models/CommentsModel');
var CompanyQuoteModel = require('../models/CompanyQuoteModel');
var CompanyQuoteAnswerMailModel = require('../models/CompanyQuoteAnswerMailModel')
var UserModel = require('../models/UserModel');
var loginRequired = require('../libs/loginRequired');
var adminRequired = require('../libs/adminRequired');
var smtpTransport = require('../libs/smtpTransport');

var rand, mailOptions, host, link;

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
    res.render('admin/adminMainPage');
});

// 관리자 기업 견적 문의 현황 조회 + 페이징
router.get('/adminCompanyQuoteState', adminRequired, function(req, res) {    
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
            res.render('admin/adminCompanyQuoteState', {companyQuoteList:companyQuoteList, curSet:curSet, startPage:startPage, endPage:endPage, totalPage:totalPage, page:page, totalSet:totalSet});
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
router.post('/adminCompanyQuoteState', adminRequired, function(req, res) {    
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
                    res.send('<script>alert("견적문의 답변 완료");location.href="/admin/adminCompanyQuoteState";</script>');
                }
            );
        });       
    }); 
});

// 관리자 기업 견적 문의 답변 메일 전송
router.get('/adminCompanyQuoteAnswerMail', adminRequired, function(req,res){
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


// 회원조회
router.get('/memberCheck', adminRequired, function(req, res){
    UserModel.find(function(err, user){
        res.render('admin/memberCheckPage', {user : user});
    });    
});


// 휴면회원관리
router.get('/withdrawMemberManage', adminRequired, function(req, res) {
    UserModel.find(function(err, user) {
        if(user.state == false){
            res.render('admin/withdrawMemberManage', {user, user});
        } else {
            res.send('<script>alert("휴면회원이 없습니다.");location.href="/admin/memberCheck";</script>');
        }
    });
});

module.exports = router;
