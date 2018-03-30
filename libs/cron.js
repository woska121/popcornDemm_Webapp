// cron 모듈화하기**
var CronJob = require('cron').CronJob;

var job = new CronJob({
cronTime: '* * * * *',
onTick: function() {    
    
},
start: false,
timeZone: 'Asia/Seoul'
});
job.start();

