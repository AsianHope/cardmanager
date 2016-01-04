Meteor.startup(function(){
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
  // Testing: clear users each time.
  if (Meteor.users.find().count() !== 0) {
	  console.log('not empty');
	  //Meteor.users.remove({});
  }
  // Create roles
  var roles = [
               {
		    		"name": ["terminal"],
		      },
              {
		    		"name": ["staff"],
		      },
              {
		    		"name": ["admin"],
		      },
		      ];

  _.each(roles, function(role) {
	  if (Meteor.roles.find({'name': role}).count() === 0) {
		  Roles.createRole(role);
	  }
  });
  
  ////////////////////////////////////////////////////////////////////
  //Create Test Users
  //
  if (Meteor.users.find().fetch().length === 0) {
	  console.log('Creating users: ');
	  var users = [
	               {name:"Normal",email:"normal@example.com",roles:[]},
	               {name:"Guard",email:"guard@example.com",roles:['terminal']},
	               {name:"Staff",email:"staff@example.com",roles:['staff']},
	               {name:"Admin",email:"admin@example.com",roles:['admin','staff','terminal']}
	               ];
	  _.each(users, function (userData) {
		  var id, user;
		  console.log(userData);
		  id = Accounts.createUser({
			  email: userData.email,
			  username: userData.name.toLowerCase().trim(),
			  password: "password",
			  profile: { name: userData.name }
		  });
		  

		  console.log(Meteor.users.find({_id: id}).fetch());
		  //email verification
		  Meteor.users.update({_id: id}, {$set:{'emails.0.verified': true}});
		  Roles.addUsersToRoles(id, userData.roles);
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
