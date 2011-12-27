var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    GithubStrategy = require('passport-github').Strategy,
    util = require('util'),
    Person;

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

passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function() {
      Person.findOne({ email:username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        //passowrd check if (person.password != password) { return done(null, false); }
        return done(null, user);
      })
    });
  }
));

// TODO: replace these
passport.use(new TwitterStrategy({
    consumerKey: 'ur4VS9QWRHIweQInzlIorA',
    consumerSecret: 'alAEuLrC9vLnH56y5O777lMzDpXcPp1SDVvQjKAvfA',
    callbackURL: "http://localhost:3000/login/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    console.log(token);
    console.log(tokenSecret);
    console.log(util.inspect(profile));

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
    clientID: 'f6257c6c3138ac264cfc',
    clientSecret: '863b5b48e3cc779d56e3a18b7ad3be2bda8e3da3',
    callbackURL: 'http://localhost:3000/login/github/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(util.inspect(profile));

    Person.findOne( {github_nick: profile.username }, function(err, person) {
      if (err) {
        return done(err, null);
      }
      if (person) {
        done(null, person);
      } else {
        person = new Person();
        person.name = profile.displayName;
        person.github_nick = profile.username;
        person.active = true;

        person.save(function(err, person) {
          if (err) { return done(err, null); }
          return done(null, person);
        });
      }
    });
  }
));

var doAuth = function (req, res, next) {
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res, next) {
    next();
  }
};

exports.init = init;
exports.doAuth = doAuth;
