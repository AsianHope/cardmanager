  Template.login.helpers({
    loggedIn: function() {
      return Meteor.userId();
    }
  })
  Template.login.events({
    "submit .terminal-login": function(event) {
      event.preventDefault();
      var cardnumber = event.target.cardnumber.value;
      event.target.cardnumber.value = "";
      return Meteor.terminalLogin(cardnumber, function(err, res) {
        if (err) {
          return console.log(err);
        }
      });
    }
  });
  
  Meteor.terminalLogin = function(cardnumber, callback) {
	  return Accounts.callLoginMethod({
	    methodArguments: [
	      {
	        cardnumber: cardnumber
	      }
	    ],
	    userCallback: callback
	  });
	};