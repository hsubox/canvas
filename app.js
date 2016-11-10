var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/js', express.static('public/js'));
app.use('/css', express.static('public/css'));
app.get('/img/:pattern', function(req, res) {
  fs.readdir('public/img', function(err, files) {
    if (files.includes(req.params.pattern)) {
      res.sendFile(__dirname + '/public/img/' + req.params.pattern);
    } else {
      res.sendFile(__dirname + '/public/img/blank.png');
    }
  });
});
app.use('/custom', express.static('public/canvas-custom.html'))
app.get('/:pattern', function(req, res) {
  res.sendFile(__dirname + '/public/canvas.html');
});
app.get('/', function(req, res) {
  var min = 1;
  var max = 1;
  fs.readdir('public/img', function(err, files) {
      max = files.length;
      var patternNumber = Math.floor(Math.random() * (max - min)) + min;
      res.redirect('/pattern' + patternNumber);
  });
});

var imageRequestedBy = false;

io.on('connection', function(socket) {
  var sockets_room = null;
  socket.on('room', function(room) {
      socket.join(room);
      sockets_room = room;
  });
  socket.on('draw', function(drawData) {
    socket.broadcast.in(sockets_room).emit('draw', drawData);
  });
  socket.on('fill', function(fillData) {
    socket.broadcast.in(sockets_room).emit('fill', fillData);
  });
  socket.on('clear', function() {
    socket.broadcast.in(sockets_room).emit('clear');
  });
  socket.on('imageRequest', function() {
    socket.broadcast.in(sockets_room).emit('imageRequest');
    imageRequestedBy = socket.id;
  });
  socket.on('image', function(imageData) {
    if (imageRequestedBy) {
      socket.broadcast.to(imageRequestedBy).emit('image', imageData);
      imageRequestedBy = null;
    }
  });
})

var port = 3000;
http.listen(port, function(){
  console.log('listening on *:' + port);
});
