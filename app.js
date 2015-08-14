var FIVE_MINUTES = 300000;

var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var lobbyFile = require('./server/javascripts/lobby');
var socketFile = require('./server/javascripts/sockets');



gameServer = express();

// view engine setup
gameServer.set('views', path.join(__dirname, 'views'));
gameServer.set('view engine', 'jade');

lobbyState = new lobbyFile.Lobby();

gameServer.use(logger('dev'));
gameServer.use(bodyParser.json());
gameServer.use(bodyParser.urlencoded({ extended: false }));
gameServer.use(cookieParser());
gameServer.use(express.static(path.join(__dirname, 'public')));

gameServer.use('/', routes);

// catch 404 and forward to error handler
gameServer.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (gameServer.get('env') === 'development') {
  gameServer.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
gameServer.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var debug = require('debug')('generated-express-app');

gameServer.set('port', process.env.PORT || 3000);

var server = gameServer.listen(gameServer.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});


gameServer.clients = {};
var io = require('socket.io').listen(server);
var socketHandler = new socketFile.SocketHandler(io);

module.exports = gameServer;