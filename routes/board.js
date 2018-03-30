var express = require('express');
var router = express.Router();
var UserModel = require('../models/UserModel');
var BoardModel = require('../models/BoardModel');
var CommentsModel = require('../models/CommentsModel');
var loginRequired = require('../libs/loginRequired');
var adminRequired = require('../libs/adminRequired');
var co = require('co');

// csrf 셋팅
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

// 이미지 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../buploads' );  // 루트의 uploads 위치
var fs = require('fs');

// multer 셋팅
var multer = require('multer');
var storage = multer.diskStorage({
    destination : function (req, file, callback) { //이미지가 저장되는 도착지 지정
        callback(null, uploadDir );
    },
    filename : function (req, file, callback) { // products-날짜.j pg(png) 저장
        callback(null, 'board-' + Date.now() + '.' + file.mimetype.split('/')[1] );
    }
});
var upload = multer({ storage : storage });


router.get('/',function(req,res){
    res.send('board app');
});


// 게시물 조회
router.get('/postList', loginRequired, function(req, res) {
    var page = req.param('page');
    if(page == null) {
        page = 1;
    }  
    BoardModel.count(function(err, totalCount){
        if(err) throw err;        
        var maxPageInSet = 5,   //페이지 카운트 갯수
            maxEntityInPage = 10,   // 한 페이지당 컨텐츠 수
            skipPage = (page-1) * maxEntityInPage; // skip -> 2페이지의 경우 앞의 10개 페이지 스킵, 3페이지는 20개 스킵 설정
            totalPage = Math.ceil(totalCount/maxEntityInPage), //전체 페이지
            totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
            curSet = Math.ceil(page/maxPageInSet), // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1, //현재 세트 내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1; //현재 세트내 출력될 마지막 페이지 

        BoardModel.find().sort({date:-1}).skip(skipPage).limit(maxEntityInPage).exec(function(err, posts) {
            if(err) throw err;
            res.render('board/postlist', {posts:posts, curSet:curSet, startPage:startPage, endPage:endPage, totalPage:totalPage, page:page, totalSet:totalSet});
        });   
    });
});

// 게시물 작성 폼 페이지 이동
router.get('/posts/write', loginRequired, csrfProtection, function(req,res){
    res.render('board/postform', {
        board : "",
        csrfToken : req.csrfToken()
    }); 
});

// 게시물 작성
// csrfProtection 성공 시에만 callback 함수
// 미들웨어 csrfProtection
router.post('/posts/write', loginRequired, upload.single('board_image'), csrfProtection, function(req,res){
    console.log("받아온값==" + req.body.board_title);
    console.log(req.user.userid);
    var board = new BoardModel({
        board_title : req.body.board_title,
        // 파일 있으면 저장, 없으면 빈 필드로 저장
        board_image : (req.file) ? req.file.filename : "",
        board_content : req.body.board_content,
        userid : req.user.userid
    });
    var validationError = board.validateSync();
    if(validationError){
        // 통과하지 못했을 때 적용
        res.send(validationError);
    }else{
        // 유효성 성공 시 적용
        board.save(function(err) {
            res.send('<script>alert("게시물 저장 완료");location.href="/board/postlist";</script>');
        });
    }
});

router.post('/posts/ajax_summernote', loginRequired, upload.single('board_image'), function(req,res){
    res.send( '/buploads/' + req.file.filename);
});

// 댓글 작성
router.post('/posts/ajax_comment/insert', adminRequired, function(req,res){
    console.log("댓글작성자===" + req.user.userid);
    var comment = new CommentsModel({
        content : req.body.content,
        board_id : parseInt(req.body.board_id),
        userid : req.user.userid
    });
    comment.save(function(err, comment){
        res.json({
            id : comment.id,
            content : comment.content,
            userid : comment.userid,
            message : "success"
        });
    });
});

// 댓글 삭제
router.post('/posts/ajax_comment/delete', adminRequired, function(req, res){
    CommentsModel.remove({ id : req.body.comment_id } , function(err){
        res.json({ message : "success" });
    });
});

// 게시물 상세보기
router.get('/posts/detail/:id' , adminRequired, function(req, res){
    var getData = co(function* (){
        // var posts 끝날때까지, comments 끝날때까지 기다렸다가 return 한꺼번에
        var board = yield BoardModel.findOne( { 'id' :  req.params.id }).exec();
        var comments = yield CommentsModel.find( { 'board_id' :  req.params.id }).exec();
        // results는 return하는 데이터와 일치한다
        return {
            board : board,
            comments : comments
        };
    });
    getData.then( function(result){
        getData.then( function(result){
        // 조회수 증가 및 저장
        result.board.hit += 1;
            result.board.save(function(err) {
                if(err) throw err; 
                res.render('board/postdetail', { board: result.board , comments : result.comments });
            });   
        });
    });
});

// 게시물 수정 페이지 
router.get('/posts/edit/:id' , adminRequired, csrfProtection, function(req, res) {
    // 기존에 폼에 value 안에 값을 셋팅하기 위해 만든다.
    BoardModel.findOne({ id : req.params.id }, function(err, board) {
        res.render('board/postform', { board : board, csrfToken : req.csrfToken()});
    });
});

// 게시물 수정 (update)
router.post('/posts/edit/:id', adminRequired, upload.single('board_image'), csrfProtection, function(req, res) {
    BoardModel.findOne( {id : req.params.id}, function(err, board){
    
    if(req.file && board.board_image) { // 요청중에 파일이 존재할 시 이전이미지 삭제
        fs.unlinkSync( uploadDir + '/' + board.board_image );
    }

    // 넣을 변수 값을 셋팅한다
    var query = {
        board_title : req.body.board_title,
        board_image : (req.file) ? req.file.filename : board.board_image,
        board_content : req.body.board_content,
    };

    // update의 첫번째 인자는 조건, 두번째 인자는 바뀔 값들
    BoardModel.update(
        { id : req.params.id },
        { $set : query },
        function(err) {
            res.redirect(
                '/board/posts/detail/' + req.params.id); // 수정 후 본래 보던 상세페이지로 이동
        });        
    });    
});

// 게시물 삭제
router.get('/posts/delete/:id', adminRequired, function(req, res){
    BoardModel.remove({ id : req.params.id }, function(err){
        res.redirect('/board/postList');
    });
});

module.exports = router;
