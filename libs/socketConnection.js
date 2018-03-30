module.exports = function(io) {
    
    io.on('connection', function(socket) {
        socket.on('client message', function(data) {
            io.emit('server message', data.message);
        });
    });
}


// var listen = require('socket.io');
// // 서버설정을 io에서 받아오기
// var io = listen(server);
// io.on('connection', function(socket){
//     //console.log('socket io connection on!!!');
//     // 받는 쪽 socket.on
//     socket.on('client message', function(data) {
//         //console.log(data);
//         // 서버에서 전송하기 
//         // io(전체사람들)에게 메세지보내기
//         io.emit('server message', data.message);