var MD5 = require('./MD5');
// Model name declarations
var Person;


function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  Person = new Schema({
    name      : String,
    email     : String,
    gravatar  : String, // MD5 hash based on email
    irc       : String,
    twitter   : String,
    github    : String,  
    github2   : String    
  });

  Person.pre('save', function (next) {
    /*
    * Generate an MD5 hash of the supplied email
    * and save that as the gravatar string before saving
    */
    this.gravatar = MD5.toMD5(this.email);
    next();
  });

  // Add to Mongoose
  mongoose.model('Person', Person);

  fn();
};

exports.defineModels = defineModels;