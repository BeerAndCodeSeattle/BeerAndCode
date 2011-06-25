
/**
 * Module dependencies.
 */

var express = require('express'),
    //people = require('./hardcoded_people').people,
    mongoose = require('mongoose'),
    models = require('./models'),
    db,
    Person,
    app = module.exports = express.createServer();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-dev');
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-test');
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-production');
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

models.defineModels(mongoose, function () {
  app.Person = Person = mongoose.model('Person');
  db = mongoose.connect(app.set('db-uri'));
});

// Bootstrap
require('./bootstrap').bootstrap(Person);

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Seattle Beer && Code'
  });
});

app.get('/people', function (req, res) {
  Person.find({}, function (err, people) {
     if (!err) {
      res.render('people', {
          title: 'People',
          locals: { 
            people: people
          }
        });       
     } 
  });  
});

app.get('/calendar', function (req, res) {
  res.render('calendar', {
    title: 'Calendar'
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
