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
  sockets.push(socket);

  socket.emit('se_history', history);

  socket.on('ce_message', function (message) {
    // - ignore any empty content
    if (null == message || message.match(/^\s*$/))
      return;

    var nickname = socket.nickname
      || (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address).replace(/[0-9]*\.[0-9]*$/, "*.*");

    message = {
      nickname: nickname,
      timestamp: new Date(),
      content: message,
    };

    history.push(message);
    _.each(sockets, function (user) {
      user.emit('se_boardcast', message);
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

