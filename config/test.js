var AWS = require('aws-sdk');
AWS.config.update({region: 'ap-northeast-2'});
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

var params = {
    StackName: 'sample10kelly',
};
cloudformation.getTemplate(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     
    //console.log(data);           // successful response
    //console.log(data.TemplateBody);
    var template = data.TemplateBody;
    var param = "Parameters";
    var ec2 = template.param;
    console.log(ec2);
  });