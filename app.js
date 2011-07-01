/**
 * Module dependencies.
 */

var express = require('express'),
    https = require('https'),
    mongoose = require('mongoose'),
    markdown = require('markdown').markdown,
    _ = require('underscore'),
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

// Poeple Related Routes
app.get('/people/new', function (req, res) {
  res.render('people/new', {
    title: 'New Person', 
    locals: {
      person: new Person()
    }
  });
});

app.get('/people/edit/:id', function (req, res) {
  Person.findOne({ url_slug: req.params.id }, function (err, person) {
    if (!err) {
      // Tack on a string representation of the languages supplied
      person.language_string = person.languages.join(', ');

      res.render('people/update', {
        title: 'Updating ' + person.name,
        locals: {
          person: person
        }
      });
    }
  });
});

app.post('/people/edit/:id', function (req, res) {
  console.dir(req.body);
  if(req.body.Save) {
    Person.findOne({ url_slug : req.params.id }, function (err, person) {
      // Perform some updating action here
      person.name = req.body.person.name;
      person.email = req.body.person.email;
      person.irc = req.body.person.irc;
      person.twitter = req.body.person.twitter;
      person.github = req.body.person.github;
      person.bio = req.body.person.bio;
      person.languages = _.map(req.body.person.language_string.split(','), function (s) { return s.replace(/ /g, ''); });

      person.save(function (err) {
        if (!err) {
          res.redirect('/people/' + req.params.id);
        } else {
          console.log(err);
        }
      });
    });
  }  
});

app.post('/people/new', function (req, res) {
  console.dir(req.body);
  var person = new Person();
  person.name = req.body.person.name;
  person.email = req.body.person.email;
  person.irc = req.body.person.irc;
  person.twitter = req.body.person.twitter;
  person.github = req.body.person.github;
  person.bio = req.body.person.bio;

  person.save(function (err) {
    if (!err) {
      res.redirect('/people/' + person.url_slug);
    } else {
      console.log(err);
    }
  });  
});

app.get('/people/:id', function (req, res) {
  Person.findOne({ url_slug: req.params.id }, function (err, person) {
    if (!err) {    
      // Convert bio from md to HTML, but don't persist
      person.bio = markdown.toHTML(person.bio);

      res.render('people/show', {
        title: person.name, 
        locals: {
          person: person
        }
      });
    }
  });
});

app.get('/people/:id/getGithubProjects', function (req, res) {
  // Download and return a list of public Github projects
  // for a user
  Person.findOne({ url_slug : req.params.id }, function (err, person) {            
    var options = {};
    if (!err) {
      // Configure the Github request
      options.host = 'github.com'
      options.path = '/api/v2/json/repos/show/' + person.github;
      options.port = 443;
      options.method = 'GET';

      https.get(options, function (httpsRes) {        
        httpsRes.on('data', function (d) {

          var projects = JSON.parse(d);
          var project_list = _.map(projects.repositories, function (repo) {
            // Return an object that looks like the projects
            // defined in the model
            return {
              'name': repo.name,
              'project_url': repo.url,
              'description': repo.description 
            };
          });
          
          res.writeHead(200, {
            'Content-Type': 'application/json'
          });

          res.end(JSON.stringify(project_list));
        });
      });
    }
  });
});

app.get('/people', function (req, res) {
  Person.find({}, [], {sort: {'name': 1}}, function (err, people) {
     if (!err) {
      res.render('people/index', {
          title: 'People',
          locals: { 
            people: people
          }
        });       
     } 
  });  
});

// End People Related Routes

app.get('/calendar', function (req, res) {
  res.render('calendar', {
    title: 'Calendar'
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
