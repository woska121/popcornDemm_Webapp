var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var autoIncrement = require('mongoose-auto-increment');


// 생성될 필드명을 정한다.
var ProductsSchema = new Schema({
    userid : {type : String, required: true},    // 상품 구매자
    productData : {type:Object, required : true}, // 구매한 상품 정보
    cybermoney_id : {type : ObjectId, required: true}, // 결제에 사용한 사이버머니 정보 (cybermoney collection join key)
    
    created_at : { // 작성일
        type : Date,
        default : Date.now()
    },
});

// 원하는 형식으로 뽑기 위해서 만듬
// 가상변수를 몽구스에 추가하는 것
// virtual 변수는 호출되면 실행하는 함수
// Object의 create의 get과 set과 비슷함
// set은 변수의 값을 바꾸거나 셋팅하면 호출
// get은 getDate 변수를 호출하는 순간 날짜 월일이 찍힌다.

ProductsSchema.virtual('getDate').get(function() {
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

// 1씩 증가하는 primary Key를 만든다
// model : 생성할 document 이름
// field : primary key, startAt : 1부터 시작
ProductsSchema.plugin( autoIncrement.plugin , { model : 'products' , field : 'id' , startAt : 1 });
module.exports = mongoose.model('products', ProductsSchema);