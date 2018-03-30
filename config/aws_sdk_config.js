var AWS = require('aws-sdk');
var uniqid = require('uniqid');

AWS.config.update({region: 'ap-northeast-2'});

var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

var stackname = uniqid();

var templateURL = 'https://s3.ap-northeast-2.amazonaws.com/cloudformation-template-kelly/ide_local_test_ec2.json';

var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

exports.cloudformation = cloudformation;
exports.stackname = stackname;
exports.templateURL = templateURL;
exports.ec2 = ec2;
