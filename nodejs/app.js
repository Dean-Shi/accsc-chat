var io = require('socket.io').listen(8080, {"log level": 1});
var _ = require('underscore');

var history = [];
var sockets = [];

io.sockets.on('connection', function (socket) {
  console.log('[debug:connect]');
  sockets.push(socket);

  socket.emit('sendhistory', history.join('\n'));

  socket.on('sendmessage', function (message) {
    console.log("[debug:sendmessage]" + message);
    history.push(message);
    _.each(sockets, function (user) {
      user.emit('boardcast', message);
    });
  });

  socket.on('disconnect', function () {
    console.log("[debug:disconnect]");
    sockets.splice(sockets.indexOf(socket), 1);
  });
});
