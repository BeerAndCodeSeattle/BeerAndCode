var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
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

  app.get('/login', function(req, res) {
    res.render('sessions/login');
  });

  // POST /login
  //   Username/password login authentication with passport
  //   Redirect to login on failure. Home on success.
  app.post('/login', 
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/'); 
    }
  );


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

var doAuth = function (req, res, next) {
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res, next) {
    next();
  }
};


exports.init = init;
exports.doAuth = doAuth;
