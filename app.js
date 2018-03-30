var config = require('./config/config');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var i18n = require('i18n'); // i18n 다국화 모듈

//flash  메시지 관련
var flash = require('connect-flash');
 
//passport 로그인 관련
var passport = require('passport');
var session = require('express-session');


//////////////////// mongoDB 접속//////////////////////
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var autoIncrement = require('mongoose-auto-increment');

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
    console.log('mongodb connect');
});

////////////// i18n 설정 ///////////////////////////
i18n.configure({
    locales : ['en', 'kr', 'jp'],
    directory : __dirname + '/locales' ,
    defaultLocale : 'kr'
});

// 다국어 테스트
// var greeting = i18n.__('hello');
// console.log('다국어 테스트---->', greeting);


// fastcampus라는 db 생성, connect
var connect = mongoose.connect(config.db_url, { useMongoClient: true });
// primary key 자동 증가 플러그인 설정
autoIncrement.initialize(connect);
////////////////////////////////////////////////////////////////////////////////////////////////
var admin = require('./routes/admin');
var accounts = require('./routes/accounts');
var auth = require('./routes/auth');
var auth2 = require('./routes/auth2');
var auth3 = require('./routes/auth3');
var home = require('./routes/home');
var chat = require('./routes/chat');
var pay = require('./routes/pay');
var toolide = require('./routes/toolide');
var products = require('./routes/products');
var promotion = require('./routes/promotion');

var app = express();
var port = config.server_port;

// 확장자가 ejs로 끝나는 뷰 엔진을 추가한다.
// 내위치/views 
app.set('views', path.join(__dirname, 'views'));
// view 엔진은 ejs로 선택, 확장자 .ejs 뷰 생성
app.set('view engine', 'ejs');

// 미들웨어 셋팅
app.use(logger('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(i18n.init);

//업로드 path 추가
app.use('/uploads', express.static('uploads'));

//static path 추가
app.use('/static', express.static('static'));


//session 관련 셋팅
var connectMongo = require('connect-mongo');
var MongoStore = connectMongo(session);

var sessionMiddleWare = session({
    secret: 'fastcampus',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 2000 * 60 * 60 //지속시간 2시간
    },
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 14 * 24 * 60 * 60
    })
});
app.use(sessionMiddleWare);

//passport 적용
app.use(passport.initialize());
app.use(passport.session());

//플래시 메시지 관련
app.use(flash());

//뷰에서만 글로벌로 사용할 수 있는 변수 셋팅
//로그인 정보 뷰에서만 변수로 셋팅, 전체 미들웨어는 router위에 두어야 에러가 안난다
app.use(function(req, res, next) {
  app.locals.isLogin = req.isAuthenticated();
  //app.locals.urlparameter = req.url; //현재 url 정보를 보내고 싶으면 이와같이 셋팅
  app.locals.userData = req.user; //사용 정보를 보내고 싶으면 이와같이 셋팅------ 충돌시 주석 풀기
  next();
});

/*
// 라우팅 추가(http://127.0.0.1:3000/posts)
app.get('/posts', function(req, res){
    res.send('posts app');
});
*/

// admin 요청 시 상단 설정한 admin 가져오시오
// routing
app.use('/', home);
app.use('/admin', admin);
app.use('/accounts', accounts);
app.use('/auth', auth);
app.use('/auth2', auth2);
app.use('/auth3', auth3);
app.use('/chat', chat);
app.use('/toolide',toolide);
app.use('/pay',pay);
app.use('/products',products);
app.use('/promotion',promotion);

// 서버측 socket.io 
var server = app.listen( port, function() {
    console.log('Express listening on port', config.db_url);
});

var listen = require('socket.io');
var io = listen(server);
require('./libs/socketConnection')(io); 
// var socket = require('./libs/socketConnection');
// socket(io);


// version 1.2.0 byNami





















