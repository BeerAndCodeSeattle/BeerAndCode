var MD5 = require('./MD5');
// Model name declarations
var Person,
    Project;

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  Project = new Schema({
    name        : String, 
    project_url : String,
    description : String
  });

  Person = new Schema({
    name      : String,
    email     : String,
    gravatar  : String, // MD5 hash based on email
    irc       : String,
    twitter   : String,
    github    : String,  
    github2   : String,
    bio       : String,
    url_slug  : String,
    languages : [String],
    projects  : [Project]
  });

  Person.pre('save', function (next) {
    /*
    * Generate an MD5 hash of the supplied email
    * and save that as the gravatar string before saving
    */
    this.gravatar = MD5.toMD5(this.email);

    /*
    * Remove spaces and weirdo characters to make an addressable
    * slug for this person. Hope people don't have the same names...
    */
    this.url_slug = this.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '-');

    next();
  });

  // Add to Mongoose
  mongoose.model('Person', Person);

  fn();
};

exports.defineModels = defineModels;