var express= require('express');
var router = express.Router();
var toolideAuthRequired = require('../libs/toolideAuthRequired');
var loginRequired = require('../libs/loginRequired');
var UserModel = require('../models/UserModel');      
var WorkspaceModel = require('../models/WorkspaceModel');  
var aws = require('../config/aws_sdk_config');
var language = require('../libs/language'); // 다국어 설정 모듈

router.get('/',function(req,res){
    res.send('toolide app');
});

// 워크스페이스 페이지 
router.get('/workspaceList', loginRequired, toolideAuthRequired, function(req, res) {
    WorkspaceModel.find({'userid' : req.user.userid}, function(err, workspace) {
            if(err) throw err;
            console.log("workspace==="+workspace);
            res.render('toolide/workspaceListPage', {workspace:workspace, language : language(req)});
    });
});

// 워크스페이스 생성 페이지 이동
router.get('/createWorkspacePage', loginRequired, toolideAuthRequired, function(req, res) {
    res.render('toolide/createWorkspacePage',{language : language(req)});
});

// 워크스페이스 생성 (Cloudformation create stack for IDE EC2 Instance)
router.get('/createWorkspace', loginRequired, toolideAuthRequired, function(req, res){
    var stackname = aws.stackname + req.user.id;
    console.log(stackname);
    var params = {
        StackName: stackname,    
        TemplateURL: aws.templateURL
    };
    aws.cloudformation.createStack(params, function(err, data) {
        if (err) {
            console.log("err1======" + err, err.stack); // an error occurred
            res.end("error");
        } else {
            console.log("data1======" + data);
            res.end(stackname);
        }   
    });
});

// 워크스페이스 생성 완료 대기, 완료 후 DB 저장
router.get('/waitForStackCreateComplete', loginRequired, toolideAuthRequired, function(req, res){
    var userStackname = req.query.args;
    var params = {
        StackName: userStackname
    }
    aws.cloudformation.waitFor('stackCreateComplete', params, function(err, data){
        var data;
        if(err) {
            console.log("err2======" + err, err.stack);
            res.send("error");
        } else {
            var total = data.Stacks;
            var stack_status = total[0].StackStatus;
            console.log ("stack_status ======" + stack_status);
            var output = total[0].Outputs;
           
            if(stack_status == "CREATE_COMPLETE"){
                for(var i=0; i<output.length; i++){
                    console.log(output[i].OutputValue);
                    data[i] = output[i].OutputValue;
                }
                // db에 stack output 정보 저장하기(instanceId, Instance PrivateIp, ELB DNS)
                WorkspaceModel.findOne({'stackname' : userStackname}, function(err, workspace) {
                    if(!workspace) {
                        var Workspace = new WorkspaceModel({
                            userid : req.user.userid,
                            stackname : userStackname,
                            ide_ec2_id : data[0],
                            ide_ec2_private_ip : data[1],
                            ide_elb_dns : data[2]
                        });
                        Workspace.save(function(err) {
                            //res.send(data);
                            res.send("CREATE_COMPLETE");  
                        });
                    } else {
                        console.log("이미 stack정보 저장됨.");
                    }
                });            
            } else if (stack_status == "CREATE_IN_PROGRESS") {
                console.log("생성중");
            } else if (stack_status == "CREATE_FAILED") {
                console.log("생성실패");
            } else if (stack_status == "ROLLBACK_IN_PROGRESS") {
                console.log("생성 중 실패");
            }             
        }      
    });    
});


// 워크스페이스(stack) 삭제
router.get('/deleteWorkspace', loginRequired, toolideAuthRequired, function(req, res){
    var userStackname = req.query.stackname;
    console.log("stackname===" + userStackname);
    var params = {
        StackName: userStackname
    };
    aws.cloudformation.deleteStack(params, function(err, data) {
        if (err) {
            console.log("err1======" + err, err.stack); // an error occurred
            res.end("error");
        } else {
            console.log("data1======" + data);
            res.end(userStackname);
        }   
    });
});

// 워크스페이스(stack) 삭제 완료 대기, 완료 후 DB 삭제
router.get('/waitForStackDeleteComplete', loginRequired, toolideAuthRequired, function(req, res){
    var userStackname = req.query.args;
    console.log("stacknameargs==" +userStackname);
    var params = {
        StackName: userStackname
    }
    aws.cloudformation.waitFor('stackDeleteComplete', params, function(err, data) {
        if(err) {
            console.log("err2======" + err, err.stack);
            res.end("error");
        } else {
            WorkspaceModel.remove({'stackname' : userStackname}, function(err, workspace) {
                    console.log('db 삭제');
                res.end("sent");  
                });      
        }      
    });   
});


module.exports=router;
