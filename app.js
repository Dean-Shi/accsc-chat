// Require all modules
// ===================
var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var _        = require('underscore');
var stylus   = require('stylus');
var nib      = require('nib');


// Project constants
// =================
var PROJECT_NAME = "ACCSC Chatroom";


// Setup application
// =================
var app = express();

app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: compile
}));

app.use(express.logger('dev'));
app.use(app.router);
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
var io = socketio.listen(server);


// Setup development error handler
// ===============================
if ('development' == app.get('env'))
  app.use(express.errorHandler());


// Setup route
// ===========
app.get('/', function (req, res) {
  res.render('index', {name: PROJECT_NAME});
});
//app.get('*', function (req, res) {res.redirect(301, '/');});


// Setup Socket.IO
// ===============
var history = [];
var sockets = [];

io.sockets.on('connection', function (socket) {
  var handleCommand = function (cmd) {
    var arg = "";

    if (-1 != cmd.indexOf(' ')) {
      arg = cmd.substr(cmd.indexOf(' ') + 1);
      cmd = cmd.split(' ', 1)[0];
    }

    var feedback = {
      type: "system/feedback",
      timestamp: new Date(),
      cmd: cmd
    }

    switch (cmd) {
      case "/nick":
        arg = arg.trim();

        if (arg === socket.nickname) {
          feedback.error = "Your nickname is already set to [" + arg + "]!";
          break;
        }

        if ("" === socket.nickname) {
          feedback.error = "Nickname cannot be empty!"
          break;
        }

        var available = true;

        for (var i = 0; i < sockets.length; i++) {
          if (sockets[i].nickname === arg) {
            available = false;
            break;
          }
        }

        if (!available) {
          feedback.error = "Nickname [" + arg + "] is already in use!";
          break;
        }

        socket.nickname = arg;
        feedback.message = "Your nickname is now set to [" + arg + "].";

        break;
      default:
        feedback.error = "Commond not found or permission denied.";
    }

    socket.emit('se_sendpacket', feedback);
  }

  sockets.push(socket);

  socket.emit('se_history', history);

  socket.on('ce_message', function (message) {
    // - ignore any empty content
    if (null == message || message.match(/^\s*$/))
      return;

    if (0 == message.indexOf('/')) {
      handleCommand(message);
      return;
    }

    var nickname = socket.nickname
      || (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address).replace(/[0-9]*\.[0-9]*$/, "*.*");

    var text = {
      type: "text/plain",
      nickname: nickname,
      timestamp: new Date(),
      content: message,
    };

    history.push(text);
    _.each(sockets, function (user) {
      user.emit('se_sendpacket', text);
    });
  });

  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
  });
});


// Launch server
// =============
server.listen(app.get('port'), function () {
  console.log('Listening on port ' + app.get('port'));
});


// Includes nib lib, compiles and compress stylus files
// ============= 
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib())
    .import('nib');
}

