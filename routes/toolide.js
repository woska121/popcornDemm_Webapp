var express= require('express');
var router = express.Router();
var toolideAuthRequired = require('../libs/toolideAuthRequired');
var loginRequired = require('../libs/loginRequired');
var UserModel = require('../models/UserModel');      
var WorkspaceModel = require('../models/WorkspaceModel');  
var aws = require('../config/aws_sdk_config');
var language = require('../libs/language'); // 다국어 설정 모듈
var moment = require('moment'); 
router.get('/',function(req,res){
    res.send('toolide app');
});


// 워크스페이스 페이지 
router.get('/workspaceList', loginRequired, toolideAuthRequired, function(req, res) {
    WorkspaceModel.find({'userid' : req.user.userid}, function(err, workspace) {
            if(err) throw err;
            console.log("workspace===",workspace);
            res.render('toolide/workspaceListPage', { workspace : workspace, language : language(req) } );
    });
});

// 워크스페이스 생성 페이지 이동
router.get('/createWorkspacePage', loginRequired, toolideAuthRequired, function(req, res) {
    res.render('toolide/createWorkspacePage',{language : language(req)});
});

// 워크스페이스 생성 (Cloudformation create stack for IDE EC2 Instance)
router.get('/createWorkspace', loginRequired, toolideAuthRequired, function(req, res){
    var stackname = req.user.displayname + aws.stackname + req.user.id;
    console.log(stackname);
    var ec2_tag_name_value = "ec2"+req.user.id+stackname;
    var elb_name = "elb"+req.user.id+stackname;
    var elb_tag_name_value = "elb"+req.user.id+stackname;
    var elb_targetgroup_name = "tg"+req.user.id+stackname;
    var route53_record_set_name = req.user.displayname+".autosar.io";

    var params = {
        StackName: stackname,    
        Parameters: [
            {
                ParameterKey: "Ec2TagNameValue",
                ParameterValue: ec2_tag_name_value
            },
            {
                ParameterKey: "ElbName",
                ParameterValue: elb_name
            },
            {
                ParameterKey: "ElbTagNameValue",
                ParameterValue: elb_tag_name_value
            },
            {
                ParameterKey: "ElbTargetGroupName",
                ParameterValue: elb_targetgroup_name
            },
            {
                ParameterKey: "Route53RecordSetName",
                ParameterValue: route53_record_set_name
            }      
        ],
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

router.get('/checkStackCreateComplete', loginRequired, toolideAuthRequired, function(req, res){
    var userStackname = req.query.args;
    var params = {
        StackName: userStackname
    };
    aws.cloudformation.describeStacks(params, function(err, data) {
        if(err) {
            console.log(err, err.stack);
        } else {
            var total = data.Stacks;
            var status = total[0].StackStatus;
            var output = total[0].Outputs;
            console.log("스택 상태===" + status);
            
            if(status == "CREATE_COMPLETE") {
                for(var i=0; i<output.length; i++){
                    console.log(output[i].OutputValue);
                    data[i] = output[i].OutputValue;
                }
                var ec2_id = data[1];
                var params2 = {
                    InstanceIds : [ec2_id]
                };
                aws.ec2.describeInstanceStatus(params2, function(err, data2) {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        var result = data2.InstanceStatuses;
                        var total_system_status = result[0].SystemStatus;
                        var system_status = total_system_status.Status;

                        if(system_status == "ok") { //EC2 상태 체크
                            // db에 stack output 정보 저장하기(instanceId, Instance PrivateIp, ELB DNS)
                            WorkspaceModel.findOne({'stackname' : userStackname}, function(err, workspace) {
                                if(!workspace) {
                                    var Workspace = new WorkspaceModel({
                                        userid : req.user.userid,
                                        stackname : userStackname,
                                        ide_elb_name : data[0],
                                        ide_ec2_id : data[1],     
                                        ide_url : data[2],                        
                                        ide_ec2_private_ip : data[3],
                                        ide_elb_dns : data[4],
                                    
                                    });
                                    Workspace.save(function(err) {
                                        console.log('db저장 및 상태 검사 통과');
                                        res.end(system_status);                            
                                    });
                                } else {
                                    console.log("이미 stack정보 저장됨.");
                                }
                            }); 
                        } else {
                            res.end(system_status);
                        }

                    }
                });
                           
            } else {
                res.end(status);
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
