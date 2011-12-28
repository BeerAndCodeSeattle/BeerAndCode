var MD5 = require('./MD5'),
    conf = require('./conf'),
    // Model name declarations
    PersonSchema,
    JobPostSchema,
    JobRequestSchema;

exports.defineModels = function (
    mongoose, 
    mongooseAuth, 
    Project,
    Person,
    JobPost,
    JobRequest,
    cb) {
  Schema = mongoose.Schema;

  Project = new Schema({
    name        : String,
    project_url : String,
    description : String
  });

  PersonSchema = new Schema({
    name          : String,
    email         : String,
    gravatar      : String, // MD5 hash based on email
    irc           : String,
    twitter_nick  : String,
    github_nick   : String,  
    bio           : String,
    url_slug      : String,
    languages     : [String],
    projects      : [Project],
    active        : Boolean
  });

  PersonSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
        User: function () {
          return Person;
        }
      }
    }, 
    twitter: {
      everyauth: {
        myHostname: 'http://localhost:3000',
        consumerKey: conf.twit.consumerKey,
        consumerSecret: conf.twit.consumerSecret,
        redirectPath: '/',
        findOrCreateUser: function (session, accessTok, accessTokSecret, twitterUser) {
          var promise = this.Promise(),
              self = this;

          Person.findOne(
            { 
              $or: 
              [
                { 'name': twitterUser.name },
                { 'twitter_nick': twitterUser.screen_name }
              ]
            }, 
            function (err, person) {
            if (err) return promise.fail(err);

            if (person) {
              return promise.fulfill(person);
            } else {
              person = new Person();
              person.name = twitterUser.name;
              person.twitter_nick = twitterUser.screen_name;
              person.bio = twitterUser.description;

              // Ok, so we're defaulting to all active accounts
              // for now. In the future, it may be useful to 
              // prevent anybody from signing up willy nilly
              // When that day comes, we can make sure new accounts
              // are inactive upon creation so they can be approved
              // later            
              person.active = true;

              person.save(function (e, p) {
                if (e) return promise.fail(e);
                return promise.fulfill(p);
              });
            }
          });

          return promise;
        }
      }          
    },
    password: {
      loginWith: 'email',
      extraParams: { name: String },
      everyauth: {
        getLoginPath: '/login',
        postLoginPath: '/login',
        loginView: 'sessions/login.jade',
        getRegisterPath: '/register',
        postRegisterPath: '/register',
        registerView: 'sessions/register.jade',
        loginSuccessRedirect: '/',
        registerSuccessRedirect: '/'
      }       
    },
    github: {
      everyauth: {
        myHostname: 'http://localhost:3000',
        appId: conf.github.appId,
        appSecret: conf.github.appSecret,
        redirectPath: '/',
        findOrCreateUser: function (session, accessTok, accessTokExtra, githubUser) {
          var promise = this.Promise(),
              self = this;

          Person.findOne(
            { $or: 
              [ 
                { 'name': githubUser.name },
                { 'github_nick': githubUser.login }, 
                { 'email': githubUser.email }
              ]
            }, 
            function (err, person) {
              if (err) return promise.fail(err);

              if (person) {
                // Found an existing person
                return promise.fulfill(person);
              } else {
                // Person doesn't already exist with that github info
                person = new Person();
                person.name = githubUser.name;
                person.email = githubUser.email;
                person.github_nick = githubUser.login;

                // Ok, so we're defaulting to all active accounts
                // for now. In the future, it may be useful to 
                // prevent anybody from signing up willy nilly
                // When that day comes, we can make sure new accounts
                // are inactive upon creation so they can be approved
                // later
                person.active = true;

                person.save(function (e, p) {
                  if (e) return promise.fail(e);
                  return promise.fulfill(p);
                });
              }
            }
          );

          return promise;
        }
      }         
    }
  });

  PersonSchema.pre('save', function (next) {
    /*
    * Generate an MD5 hash of the supplied email
    * and save that as the gravatar string before saving
    */
    if (this.email) {
      this.gravatar = require('./MD5').toMD5(this.email);
    }

    /*
    * Remove spaces and weirdo characters to make an addressable
    * slug for this person. Hope people don't have the same names...
    */
    this.url_slug = this.name.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9\-]/g, '');

    next();
  });

  JobPostSchema = new Schema({
    headline      : String,
    company_name  : String,
    description   : String,
    category      : {type: String, enum: ['ft', 'pt', 'fl', 'ct']}, /* full-time, part-time, freelance, contract */
    info_url      : String,
    contact_email : String,
    technologies  : [String],
    date_created  : Date
  });

  JobPostSchema.pre('save', function (next) {
    this.date_created = this.date_created || new Date();
    next();
  });

  JobRequestSchema = new Schema({
    headline      : String,
    category      : {type: String, enum: ['ft', 'pt', 'fl', 'ct']}, /* full-time, part-time, freelance, contract */    
    technologies  : [String],
    date_created  : Date
  });

  JobRequestSchema.pre('save', function (next) {
    this.date_created = this.date_created || new Date();
  });

  // Add to Mongoose
  Person = mongoose.model('Person', PersonSchema);
  JobPost = mongoose.model('JobPost', JobPostSchema);
  JobRequest = mongoose.model('JobRequest', JobRequestSchema);

  cb();
};
