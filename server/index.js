Meteor.startup(function(){
  
  // Testing: clear users each time.
  if (Meteor.users.find().count() !== 0) {
    console.log('not empty');
    //Meteor.users.remove({});
  }

  var existing_roles = Meteor.roles.findOne();
  //if there's no data, please load some test data
  if(!existing_roles){
    var roles = JSON.parse(Assets.getText('fixtures/roles.json'));
    _.each(roles, function(role){
      if (Meteor.roles.find({'name': role}).count() === 0) {
        Roles.createRole(role);
      }
    });
  }
  
  var existing_users = Meteor.users.findOne();
  //if there's no data, please load some test data
  if(!existing_users){
    var users = JSON.parse(Assets.getText('fixtures/users.json'));
    _.each(users, function(userData){
      var id, user;
	  console.log(userData);
	  id = Accounts.createUser({
	    email: userData.email,
	    username: userData.name.trim(), //toLowerCase().trim(),
	    password: "password",
	    profile: { name: userData.name }
	  });
	
      console.log(Meteor.users.find({_id: id}).fetch());
      //email verification
      Meteor.users.update({_id: id}, {$set:{'emails.0.verified': true}});
      Roles.addUsersToRoles(id, userData.roles, Roles.GLOBAL_GROUP);
    });
  }

  var existing_cards = Cards.findOne();
  var existing_scans = Scans.findOne();
  var existing_actions = Actions.findOne();
  //if there's no data, please load some test data
  if(!existing_cards){
    var cards = JSON.parse(Assets.getText('fixtures/cards.json'));
    _.each(cards, function(card){
      Cards.insert(card);
    });
  }
  if(!existing_scans){
    var scans = JSON.parse(Assets.getText('fixtures/scans.json'));
    _.each(scans, function(scan){
      Scans.insert(scan);
    });
  }
  if(!existing_actions){
    var actions = JSON.parse(Assets.getText('fixtures/actions.json'));
    _.each(actions, function(action){
      Actions.insert(action);
    });
  }
  ////////////////////////////////////////////////////////////////////
  //Prevent non-authorized users from creating new users
  //
  Accounts.validateNewUser(function (user) {
    var loggedInUser = Meteor.user();
    if (Roles.userIsInRole(loggedInUser, ['admin','staff'])) {
      return true;
    }
    throw new Meteor.Error(403, "Not authorized to create new users");
  });

});

// Set usernames to email address.
Accounts.onCreateUser(function(options, user) {
  user.username = user.emails[0].address;
  user.profile = options.profile ? options.profile : {};
  return user;  
});

Meteor.methods({
  getCard: function(text){
    card = Cards.findOne({
      cardnumber: text,
      barcode: {$regex: /first/}
    });
    console.log(text);
    if(card == null){
      card =
          {
          	"name": "Card Not Found!",
          	"barcode": "XXX",
          	"associations": [
          	],
          	"expires": "XXXX-XX-XX"
          };
    }
    console.log("returning: "+card.name)
    Session.set("currentcard", card);
  }
});
