var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/js', express.static('public/js'));
app.use('/css', express.static('public/css'));
app.use('/img', express.static('public/img'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/canvas.html');
});

io.on('connection', function(socket) {
  socket.on('draw', function(drawData){
    socket.broadcast.emit('draw', drawData);
  });
  socket.on('fill', function(fillData){
    socket.broadcast.emit('fill', fillData);
  });
  socket.on('clear', function(){
    socket.broadcast.emit('clear');
  });
})

var port = 3000;
http.listen(port, function(){
  console.log('listening on *:' + port);
});
