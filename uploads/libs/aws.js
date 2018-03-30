/*
* Author : Wonnjoon Cho
* Created Dare : 2017-10-23
* */


// Init
var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

// set secure keys
var options = new Options(
    /* accessKey    */ 'AKIAIYQZULBADVBRZREA',
    /* secretKey    */ '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',
    /* currentWorkingDirectory */ null
);

// Create AWS module object
var aws = new Aws(options);

// init export variable
var app = exports = module.exports = {};

// Get iam list-user and callback data
app.iamListUsers = function iamListUsers(callback) {
    aws.command('iam list-users').then(function (data) {
        console.log('data = ', data);
        callback(data);
    });
};

// sample
app.sample = function sample(arg1, arg2, callback) {
    var command = 'vpc ' + arg1 + arg2;
    aws.command(command).then(function (data) {
        console.log('data = ', data);
        callback(data);
    })
}

