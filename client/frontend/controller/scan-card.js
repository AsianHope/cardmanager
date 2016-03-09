var defaultstatus = {
  class: 'defaultstatus',
  message: 'Welcome to the Logos Card Reader'
};

Session.set('network_connection_status',navigator.onLine)
// if online or offline
jQuery(window).on('offline', function (e) {
  Session.set('network_connection_status',navigator.onLine);
}).on('online', function (e) {
  Session.set('network_connection_status',navigator.onLine);
});

Session.set("currentcard", DEFAULT_CARD);
Session.set("currentstatus", defaultstatus);
Template.scanCard.helpers({
  cards: function () {
    return Cards.find({});
  },
  scans: function () {
    return Scans.find({});
  },
  currentcard: function(){
    return Session.get("currentcard");
  },
  currentstatus: function(){
    return Session.get("currentstatus");
  },
  cardsoncampus: function() {
    return CardsOnCampus.find({});
  },
  connection : function(){
    // if server run
    if(Meteor.status().connected){
      if(Session.get('network_connection_status') == true){
        return true;
      }
      else{
        return false;
      }
    }
    else {
      return false;
    }
  }
});

Template.scanCard.events({
  //check people in and out by scanning their card
  "submit .new-scan": function (event) {
    event.preventDefault();
    var barcode = event.target.text.value;
    card = Cards.findOne({'barcode':barcode})
    if (card){
      var expires = moment(card.expires).format('x');
      var now = moment(new Date()).format('x');
      // if card expires
      if(expires > now){
        scan = Scans.findOne({
          $and:[
            {'cardnumber':barcode},
            {'action':'Security Scan'},
            { $or:[{'scantimes': { $size: 1 }},{'scantimes.1':null}] }
          ]},
          {sort: {'scantimes.0' : -1}
        })
        // scan out
        if(scan){
          scan_out_sms = {
            class: 'exit',
            message: 'Exiting'
          }

          // call scanOut method from server
          Meteor.call('scanOut',scan._id,new Date())

          Session.set('currentcard',card)
          Session.set('currentstatus',scan_out_sms)
        }
        // scan in
        else{
          scan_in_sms = {
            class: 'enter',
            message: 'Entering'
          }
          // call scanIn() method from server
          Meteor.call('scanIn',card.barcode,new Date(),"Security Scan",0.00,[],Meteor.userId());

          Session.set('currentcard',card)
          Session.set('currentstatus',scan_in_sms)
        }
      }
      else{
        expires_card = {
          class: 'card_expire',
          message: 'Card has expired !'
        }
        Session.set('currentcard',card)
        Session.set('currentstatus',expires_card)
      }
    }
    // Invalid card
    else{
      invalid_card = {
        class: 'invalid',
        message: 'Invalid Card !'
      }

      Session.set('currentcard',INVALID_CARD)
      Session.set('currentstatus',invalid_card)
    }
    // Clear form
    event.target.text.value = "";
  }

});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
