var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

// 생성될 필드명을 정한다.
var WorkspaceSchema = new Schema({
    userid : {
        type : String
    },
    stackname : {
        type : String
    },
    ide_ec2_id : {
        type : String
    },
    ide_ec2_private_ip : {
        type : String 
    },
    ide_elb_dns : { // ide aws elb dns
        type : String
    },
    ide_create_at : {
        type : Date,
        default : Date.now()
    }    
});

WorkspaceSchema.virtual('getDate').get(function() {
    var date = new Date(this.ide_create_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

WorkspaceSchema.plugin( autoIncrement.plugin , { model : 'workspaces' , field : 'id' , startAt : 1 });
module.exports = mongoose.model('workspaces', WorkspaceSchema);