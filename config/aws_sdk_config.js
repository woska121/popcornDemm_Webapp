var AWS = require('aws-sdk');
var uniqid = require('uniqid');


AWS.config.update({region: 'ap-northeast-2'});

var cloudformation = new AWS.CloudFormation({
    apiVersion : '2010-05-15',
    accessKeyId : 'AKIAJ237GO6F46ZENRMQ',
    secretAccessKey : '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'
});
var ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    accessKeyId : 'AKIAJ237GO6F46ZENRMQ',
    secretAccessKey : '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'
});
var apigateway = new AWS.APIGateway({apiVersion: '2015/07/09'});

var stackname = uniqid();
var templateURL = 'https://s3.ap-northeast-2.amazonaws.com/cloudformation-template-kelly/create_ide_ec2_3.json';


exports.cloudformation = cloudformation;
exports.ec2 = ec2;
exports.apigateway = apigateway;

exports.stackname = stackname;
exports.templateURL = templateURL;
