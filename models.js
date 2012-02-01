var MD5 = require('./MD5'),
    conf = require('./conf'),
    // Model name declarations
    PersonSchema,
    JobPostSchema,
    JobRequestSchema;

exports.defineModels = function (
    mongoose, 
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
    password      : String,
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
