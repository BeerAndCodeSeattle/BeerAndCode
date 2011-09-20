var MD5 = require('./MD5');
// Model name declarations
var Person,
    Project,
    JobPost,
    JobRequest;

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
    bio       : String,
    url_slug  : String,
    languages : [String],
    projects  : [Project]
  });

  JobPost = new Schema({
    headline      : String,
    company_name  : String,
    description   : String,
    category      : {type: String, enum: ['ft', 'pt', 'fl', 'ct']}, /* full-time, part-time, freelance, contract */
    info_url      : String,
    contact_email : String,
    technologies  : [String],
    date_created  : Date
  });

  JobRequest = new Schema({
    headline      : String,
    category      : {type: String, enum: ['ft', 'pt', 'fl', 'ct']}, /* full-time, part-time, freelance, contract */    
    technologies  : [String],
    date_created  : Date
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

  JobPost.pre('save', function (next) {
    this.date_created = this.date_created || new Date();
    next();
  });

  JobRequest.pre('save', function (next) {
    this.date_created = this.date_created || new Date();
  });

  // Add to Mongoose
  mongoose.model('Person', Person);
  mongoose.model('JobPost', JobPost);
  mongoose.model('JobRequest', JobRequest);

  fn();
};

exports.defineModels = defineModels;