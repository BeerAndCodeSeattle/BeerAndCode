exports.bootstrap = function (Person) {
  Person.findOne({ email: 'david.dean.pierce@gmail.com' }, function (err, person) {
    if(!person) {
      var david = new Person();
      david.name = 'David Pierce';
      david.email = 'david.dean.pierce@gmail.com';
      david.irc = 'TheDahv';
      david.twitter = 'TheDahv';
      david.github = 'TheDahv';
      david.github2 = null;
      david.bio = "Hi I'm David. I started **writing** code and drinking beer and it turned into Beer && Code";
      david.languages = ['javascript', 'node', 'c#', 'jQuery', 'css'];
      david.save(function (err) {
        if (err) {
          throw err;
        }
      });
    }
  });
};