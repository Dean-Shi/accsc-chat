// Require all modules
// ===================
var express  = require('express');
var http     = require('http');
var socketio = require('socket.io');
var _        = require('underscore');


// Project constants
// =================
var PROJECT_NAME = "ACCSC Chatroom";


// Setup application
// =================
var app = express();

app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

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

  socket.emit('sendhistory', history.join('\n'));

  socket.on('sendmessage', function (message) {
    history.push(message);
    _.each(sockets, function (user) {
      user.emit('boardcast', message);
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
