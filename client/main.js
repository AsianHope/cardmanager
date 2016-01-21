Template.login.onCreated(function() {
  this.lastError = new ReactiveVar(null);
});

Template.login.helpers({
  loggedIn: function() {
    return Meteor.userId();
  },
  errorMessage: function() {
    return Template.instance().lastError.get();
  }
})

Template.login.events({
  "submit .terminal-login": function(event, template) {
    event.preventDefault();
    var cardnumber = event.target.cardnumber.value;
    event.target.cardnumber.value = "";
    return Meteor.terminalLogin(cardnumber, function(error, res) {
      if (error) {
        template.lastError.set("Login denied");
      } else {
        template.lastError.set(null);
      }
    });
  }
});
  
Meteor.terminalLogin = function(cardnumber, callback) {
  return Accounts.callLoginMethod({
    methodArguments: [{
      cardnumber: cardnumber
    }],
    userCallback: callback
  });
};