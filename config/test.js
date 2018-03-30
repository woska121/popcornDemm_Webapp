var AWS = require('aws-sdk');
AWS.config.update({region: 'ap-northeast-2'});
var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});
var apig = new AWS.APIGateway();
var elb = new AWS.ELB({apiVersion: '2012-06-01'});

// var params = {
//     StackName: 'sample10kelly',
// };
// cloudformation.getTemplate(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     
//     //console.log(data);           // successful response
//     //console.log(data.TemplateBody);
//     var template = data.TemplateBody;
//     var parameter = template;
//     console.log(parameter.Parameters);
//   });

// var ec2_name_value = template.Parameters.TagNameValue.Default;
// ec2_name_value = "ec2-kelly1";

// apig.createRestApi({
//     name: "Simple PetStore (node.js SDK)",
//     binaryMediaTypes: [
//     '*'
//     ],
//     description: "Demo API created using the AWS SDK for node.js",
//     version: "0.00.001"
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log('Create API failed:\n', err);
//     }
//    });
// c6ho7b1zti

// apig.getResources({
//     restApiId: 'c6ho7b1zti'
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log('Get the root resource failed:\n', err);
//     }
// })
// wts7ebdd8l

// apig.createResource({
//     restApiId: 'c6ho7b1zti',
//     parentId: 'wts7ebdd8l',
//     pathPart: 'pets'
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log("The '/pets' resource setup failed:\n", err);
//     }
//    })
// szv109

// apig.createResource({
//     restApiId: '19vgjw8e36',
//     parentId: 'elkkjxtvf5',
//     pathPart: '{userId}'
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log("The '/{userId}' resource setup failed:\n", err);
//     }
//    })
// fycge0
//tn5akx

// apig.putMethod({
//     restApiId: '19vgjw8e36',
//     resourceId: 'tn5akx',
//     httpMethod: 'GET',
//     authorizationType: 'NONE',
//     requestParameters: {
//     "method.request./.userId" : true
//     }
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log("The 'GET /{userid}' method setup failed:\n", err);
//     }
//    })

// apig.putMethodResponse({
//     restApiId: 'c6ho7b1zti',
//     resourceId: "fycge0",
//     httpMethod: 'GET',
//     statusCode: '200'
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log("Set up the 200 OK response for the 'GET /pets/{petId}' method failed:", err);
//     }
//    })

// apig.putIntegration({
//     restApiId: 'c6ho7b1zti',
//     resourceId: 'fycge0',
//     httpMethod: 'GET',
//     type: 'HTTP',
//     integrationHttpMethod: 'GET',
//     uri: 'http://perstore-demo-endpoint.execute-api.com/pets/{id}',
//     requestParameters: {
//     "integration.request.path.id": "method.request.path.petId"
//     }
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else {
//     console.log("The 'GET /pets/{petId}' method integration setup failed:\n", err);
//     }
//    })


// apig.putIntegrationResponse({
//     restApiId: 'c6ho7b1zti',
//     resourceId: 'fycge0',
//     httpMethod: 'GET',
//     statusCode: '200',
//     selectionPattern: ''
//    }, function(err, data){
//     if (!err) {
//     console.log(data);
//     } else
//     console.log("The 'GET /pets/{petId}' method integration response setup failed:\n",
//     err);
//    })


// apig.testInvokeMethod({
//     restApiId: 'iuo308uaq7',
//     resourceId: 'au5df2',
//     httpMethod: "GET",
//     pathWithQueryString: '/'
//    }, function(err, data){
//     if (!err) {
//     console.log(data)
//     } else {
//     console.log('Test-invoke-method on 'GET /pets/{petId}' failed:\n', err);
//     }
//    })
   
// apig.createDeployment({
//     restApiId: '19vgjw8e36',
//     stageName: 'v1',
//     stageDescription: 'test deployment',
//     description: 'API deployment'
//    }, function(err, data){
//     if (err) {
//     console.log('Deploying API failed:\n', err);
//     } else {
//     console.log("Deploying API succeeded\n", data);
//     }
//    })

//v6oilt

// var params = {
//     restApiId: 'uh3r8szn0l' /* required */
//   };
//   apig.getRestApi(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     console.log(data);           // successful response
//   });