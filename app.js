var express = require('express'),
    mongoose = require('mongoose'),
    mongooseAuth = require('mongoose-auth'),
    conf = require('./conf'),
    markdown = require('markdown').markdown,
    _ = require('underscore'),
    models = require('./models'),

    app,
    handleError,
    Person, 
    Project,
    JobPost, 
    JobRequest;

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

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-dev');
});

app.configure('test', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-test');
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/bandc206-production');
});

mongoose.connect(app.set('db-uri'));
models.defineModels(
  mongoose, 
  mongooseAuth, 
  Project,
  Person,
  JobPost,
  JobRequest,
  function () {
    app.Person = Person = mongoose.model('Person');
    app.JobPost = JobPost = mongoose.model('JobPost');
    app.JobRequest = JobRequest = mongoose.model('JobRequest');
});

app.configure(function () {
  app.use(mongooseAuth.middleware());
});
  
var doAuth = function (req, res, next) {
  if (req.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

var ensureOwnsObject = function (req, res, next) {
  if (req.params.id === req.user.url_slug) {
    next();
  } else {
    res.redirect('/not_authorized');
  }
};

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
  res.writeHead(500, {'Content-Type': 'text/html'});
  res.render('error', { locals: { err: err } });
};

// People Related Routes
app.get('/people/new', function (req, res) {
  res.render('people/new', {
    title: 'New Person', 
    locals: {
      person: new Person()
    }
  });
});

app.get('/people/edit/:id', doAuth, ensureOwnsObject, function (req, res) {
  Person.findOne({ url_slug: req.params.id }, function (err, person) {
    if (err) {
      handleError(err, res);
    } else {
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

app.post('/people/edit/:id', doAuth, ensureOwnsObject, function (req, res) {
  if(req.body.Save) {
    Person.findOne({ url_slug : req.params.id }, function (err, person) {
      // Perform some updating action here
      person.name = req.body.person.name;
      person.email = req.body.person.email;
      person.irc = req.body.person.irc;
      person.twitter_nick = req.body.person.twitter_nick;
      person.github_nick = req.body.person.github_nick;
      person.bio = req.body.person.bio;
      person.languages = _.map(req.body.person.language_string.split(','), function (s) { return s.replace(/\s/g, ''); });

      person.save(function (err) {
        if (err) {
          handleError(err, res);
        } else {
          res.redirect('/people/' + req.params.id);
        }
      });
    });
  }  
});

app.post('/people/addProjectToPerson/:id', doAuth, ensureOwnsObject, function (req, res) {
  Person.findOne({ url_slug : req.params.id }, function (err, person) {
    console.log(req.body);
    var project = {
      name: req.body.project_name,
      project_url: req.body.project_url,
      description: req.body.project_description
    }; 

    person.projects.push(project);
    person.save(function (err) {
      if (!err) {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        res.end('OK');        
      } else {
        console.log(err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('ERROR: ' + err);
      }
    });
  });
});

app.post('/people/new', doAuth, function (req, res) {
  console.dir(req.body);
  var person = new Person();
  person.name = req.body.person.name;
  person.email = req.body.person.email;
  person.irc = req.body.person.irc;
  person.twitter_nick = req.body.person.twitter_nick;
  person.github_nick = req.body.person.github_nick;
  person.bio = req.body.person.bio;

  person.save(function (err) {
    if (err) {
      handleError(err, res);
    } else {
      res.redirect('/people/' + person.url_slug);
    }
  });  
});

app.get('/people/:id', doAuth, function (req, res) {
  Person.findOne({ url_slug: req.params.id }, function (err, person) {
    if (err) {    
      handleError(err, res);
    } else {
      if (person.bio) {
        // Convert bio from md to HTML, but don't persist
        person.bio = markdown.toHTML(person.bio);    
      }

      res.render('people/show', {
        title: person.name, 
        locals: {
          person: person
        }
      });
    }
  });
});

app.get('/people/getGithubProjects/:ghid', doAuth, function (req, res) {
  // Download and return a list of public Github projects
  // for a user
  var options = {};
  // Configure the Github request
  options.host = 'github.com'
  options.path = '/api/v2/json/repos/show/' + req.params.ghid;
  options.port = 443;
  options.method = 'GET';

  require('https').get(options, function (httpsRes) {        
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
});

app.get('/people', function (req, res) {
  Person.find({}, [], {sort: {'name': 1}}, function (err, people) {
     if (err) {
       handleError(err, res);
     } else {
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

// Jobs routes
app.get('/jobs/createJobPost', doAuth, function (req, res) {
  res.render('jobs/new_job_post', { 
    title: 'New Job Post'
  });
});

app.post('/jobs/createJobPost', doAuth, function (req, res) {
  var data = req.body.job;
  var job_post = new JobPost();
  job_post.headline = data.headline;
  job_post.company_name = data.company_name;
  job_post.description = data.description;
  job_post.info_url = data.info_url;
  job_post.contact_email = data.contact_email;
  job_post.technologies = _.map(data.technologies_string.split(','), function (t) { return t.trim(); });
  job_post.save(function (err) {
    if (err) {
      handleError(err, res); 
    } else {
      res.redirect('/jobs/jobPost/' + job_post.id);
    }

  });
});

app.get('/jobs/jobPost/:id', doAuth, function (req, res) {
  JobPost.findById(req.params.id, function(err, job) {
    res.render('jobs/job_post', {
      title: 'Job Post',
      locals: {
        job: job
      }
    });
  });
});

app.get('/jobs/createJobRequest', doAuth, function (req, res) {
  res.render('jobs/new_job_request', {
    title: 'New Job Request'
  });
});

app.post('/jobs/createJobRequest', doAuth, function (req, res) {
  res.redirect('/');
});

app.get('/jobs', doAuth, function (req, res) {
  var currentDate = new Date();
  var expirationDate = currentDate.setDate(currentDate.getDate() - 30);

  JobPost.find({ date_created: {$gt : expirationDate }}, function (err1, job_posts) {    
    JobRequest.find({ date_created: {$gt : expirationDate }}, function (err2, job_requests) {      
      var modified_requests, modified_postings;

      if (err1) {
        handleError(err1, res); 
      } else if (err2) {
        handleError(err2, res);
      } else {
        var techs = _.union(
          _.map(job_posts, function (j) { return j.technologies; }), 
          _.map(job_requests, function (j) { return j.technologies; }
        ));

        res.render('jobs/index', {
          title: 'Jobs',
          locals: {
            job_posts: job_posts,
            job_requests: job_requests,
            technologies: techs
          }
        });     
      }
    });    
  });
});

mongooseAuth.helpExpress(app);
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
