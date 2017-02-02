var express = require('express'),
    conf = require('./conf'),
    handleError,
    app;

// Configuration
app = express.createServer(
  express.bodyParser(),
  require('stylus').middleware({ src: __dirname + '/public' }),
  express.favicon(__dirname + '/public/favicon.ico'),
  express.static(__dirname + '/public'),
  express.cookieParser(),
  express.session({ secret: 'a1b2c3d4' })
);

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'Seattle Beer && Code'
  });
});

app.get('/not_authorized', function (req, res) {
  res.render('not_authorized', {
    title: 'NONONONONONO'
  });
});

handleError = function (err, res) {
  res.render('error', { err: err });
};

app.get('/calendar', function (req, res) {
  res.render('calendar', {
    title: 'Calendar'
  });
});

app.get('/about',function (req, res) {
  res.render('about/index', { 
    title: 'About'
  });
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
