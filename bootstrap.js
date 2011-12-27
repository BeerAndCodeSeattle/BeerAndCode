var mongoose = require('mongoose'),
    models = require('./models'),
    Person, 
    Project,
    JobPost, 
    JobRequest;

mongoose.connect('mongodb://localhost:27017/bandc206-dev');
models.defineModels(
  mongoose, 
  Project,
  Person,
  JobPost,
  JobRequest,
  function () {
    Person = mongoose.model('Person');
    JobPost = mongoose.model('JobPost');
    JobRequest = mongoose.model('JobRequest');
});

var people = [];

/*
people.push({
  name: 'Beau Simensen',
  email: '',
  irc: 'simensen',
  twitter: 'kirkrynn',
  github: 'simensen',  
  bio: 'My bio',
  languages: ['html']
});
*/

people.push({
  name: 'David Pierce',
  email: 'david.dean.pierce@gmail.com',
  irc: 'TheDahv',
  twitter: 'TheDahv',
  github: 'TheDahv',
  bio: "Hi I'm David. I started **writing** code and drinking beer and it turned into Beer && Code",
  languages: ['javascript', 'node', 'c#', 'jQuery', 'css']
});

people.push({
  name : 'Dustin Venegas',
  email : 'dustin.venegas@gmail.com',
  irc : 'electricEmu',
  twitter : 'dustinvenegas',
  github : 'DustinVenegas',
  bio : "venegas vio",
  languages : ['javascript', 'node', 'c#', 'delphi', 'css']
});

/*
people.push({
  name: "Jason",
  email: '',
  irc: "trafficone",
  twitter: "Trafficone",
  github: "trafficone",
  bio: '',
  languages : []
});

people.push({
  name: "Scott Moak",
  email: '',
  irc: "smoak",
  twitter: "smoakin",
  github: "smoak",
  bio : 'My Bio',
  languages : []
});

people.push({
  name: "Bill Fraser",
  email: '',
  irc: "graycode",
  twitter: "graycode",
  github: "wfraser",
  bio: 'My Bio',
  languages : []
});

people.push({
  name: "Josh LaRosee",
  email: '',
  irc: "jlarosee",
  twitter: "joshlarosee",
  github: "halogencreative",
  bio: 'My Bio',
  languages : []
});

people.push({
  name: "Paul Betts",
  email: '',
  irc: "bettsp",
  twitter: "xpaulbettsx",
  github: "xpaulbettsx",
  bio: '',
  languages:[]
});

people.push({
  name: "Brandon Fallout",
  email: '',
  irc: "P4r4d0x",
  twitter: "What's Twitter?",
  github: "P4r4d0x42",
  bio: 'My Bio',
  languages: []
});
*/

for(var i=0; i<people.length; i++) {
  var savePerson = function(dude) {
    console.log('Checking ' + dude.email);
    Person.findOne({ email:dude.email }, function (err, person) {
      if(!person) {
        var p = new Person();
        p.name = dude.name;
        p.email = dude.email;
        p.irc = dude.irc;
        p.twitter_nick = dude.twitter;
        p.github_nick = dude.github;
        p.bio = dude.bio;
        p.languages = dude.languages;
        p.projects = [],
        p.active = true

        p.save(function (err) {
          if (err) { throw err; }
        });
      }
    });
  }(people[i]);
}
