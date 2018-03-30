var WorkspaceModel = require('../models/WorkspaceModel');  
var aws = require('../config/aws_sdk_config');


WorkspaceModel.find({'stackname' : 'kellyg2pc96rgjc5jorb813'}, function(err, workspace2) {
    var ec2_id = workspace2.ide_ec2_id;
    console.log("ec2id===" + ec2_id);
    var params5 = {
    Filters: [
        {
            Name: "attachment.instance-id", 
            Values: [
                ec2_id
            ]
        }, 
        {
            Name: "attachment.delete-on-termination", 
            Values: [
                "false"
            ]
        }
    ]
    };
    aws.ec2.describeVolumes(params5, function(err2, data5) {
        if(err2) {
            console.log(err2, err2.stack);
        } else {
            console.log(data5);
            var a = data5.Volumes;
            console.log("a===" + a[0]);
            var b = a[0].VolumeId;
            console.log(b);
        }
    });
});