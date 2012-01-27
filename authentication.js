var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    GithubStrategy = require('passport-github').Strategy,
    util = require('util'),
    conf = require('./conf'),
    Person;

var callback_url_base = 'http://bandc-demo.herokuapp.com';

function init(app, person) {
  Person = person;

  app.configure(function() {
    app.use(passport.initialize());
    app.use(passport.session()); // Support persistent login sessions
  });

  app.dynamicHelpers({
    user: function(req, res) { return req.user; }
  });

  // Login Routes
  //   Username/password login authentication with passport
  //   Redirect to login on failure. Home on success.
  //
  app.get('/login', function(req, res) {
    res.render('sessions/login');
  });

  // Password auth
  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
      res.redirect('/');
    }
  );

  // Twitter auth
  app.get('/login/twitter',
    passport.authenticate('twitter'),
      function(req, res) {
        // Req redirected to Twitter for auth
      });

  app.get('/login/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  // Github Auth
  app.get('/login/github', 
    passport.authenticate('github'),
      function(req, res) {
        // Req redirected to Github for auth
      });

  app.get('/login/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  // Logout

  app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    }
  );
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Person.findById(id, function (err, user) {
    done(err, user);
  });
});

// Strategy Setup

// TODO: replace these
passport.use(new TwitterStrategy({
    consumerKey: conf.twit.consumerKey,
    consumerSecret: conf.twit.consumerSecret,
    callbackURL: callback_url_base + '/login/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    Person.findOne( {twitter_nick: profile.username }, function (err, person) {
      if (err) { 
        return done(err, null); 
      }
      if (person) {
        done(null, person); 
      } else { 
        person = new Person();
        person.twitter_nick = profile.screenName;
        person.active = true;

        person.save(function (err, person) {
          if (err) { return done(err, null); }
          return done(null, person);
        });
      }
    });
  }
));

passport.use(new GithubStrategy({
    clientID: conf.github.appId,
    clientSecret: conf.github.appSecret,
    callbackURL: callback_url_base + '/login/github/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // console.log(accessToken);
    // console.log(refreshToken);
    // console.log(util.inspect(profile));

    Person.findOne( {github_nick: profile.username }, function(err, person) {
      if (err) {
        return done(err, null);
      }

      if (person) {
        done(null, person);
      } else {
        person = new Person();
        person.name = profile.displayName;
        if (profile.emails.length > 0) {
          person.email = profile.emails[0].value;
        }
        person.github_nick = profile.username;
        person.active = true;

        person.save(function(err, p) {
          if (err) { return done(err, null); }
          return done(null, p);
        });
      }
    });
  }
));

var doAuth = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

var currentlyLoggedInPerson = function (req, res, next) {
  if (req.session) {
    Person.findById(req.session.passport.user, function (err, person) {
      if (err) { 
        // res.writeHead(500, {'Content-Type': 'text/html'});
        // res.render('error', { locals: { err: err } });
      } else {
        req.current_person = person;
      }
      next();
    });
  } else {
    req.current_person = null;
    next();
  }
};

exports.init = init;
exports.doAuth = doAuth;
exports.currentlyLoggedInPerson = currentlyLoggedInPerson;
