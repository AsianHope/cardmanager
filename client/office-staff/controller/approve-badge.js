var defaultstatus = {
  class: '',
  message: ''
};

Session.set("current_approve_card", DEFAULT_CARD);
Session.set("current_current_approve_card_status", defaultstatus);

Template.approveBadge.helpers({
  current_approve_card: function(){
    return Session.get("current_approve_card");
  },
  current_current_approve_card_status: function(){
    return Session.get("current_current_approve_card_status");
  }
});

Template.approveBadge.events({
  //check people in and out by scanning their card
  "submit form": function (event) {
    event.preventDefault();
    var barcode = event.target.barcode.value;
    card = Cards.findOne({'barcode':barcode})
    if (card){
      var expires = moment(card.expires).format("MM D YYYY");
      var now = moment(new Date()).format("MM D YYYY");
      // if card expires
      if(new Date(expires) > new Date(now)){
        scan = Scans.findOne({
          $and:[
            {'cardnumber':barcode},
            {'action':'Security Scan'},
            { $or:[{'scantimes': { $size: 1 }},{'scantimes.1':null}] }
          ]},
          {sort: {'scantimes.0' : -1}
        })
        //if badge didn't exit the campus
        if(scan){
          var r = confirm("Badge didn't exit the campus ! Do you want to scan out this Badge?");
          // if confirm yes
          if (r == true) {
            scan_out_sms = {
              class: 'exit',
              message: 'Exiting'
            }

            // call scanOut method from server
            Meteor.call('scanOut',scan._id,new Date())

            Session.set('current_approve_card',card)
            Session.set('current_current_approve_card_status',scan_out_sms)
          }
          // if confirm no
          else {
            scan_out_sms = {
              class: 'card_expire',
              message: 'Badge didn\'t exit the campus'
            }

            Session.set('current_approve_card',card)
            Session.set('current_current_approve_card_status',scan_out_sms)
          }

        }
        // scan in
        else{
          scan_in_sms = {
            class: 'enter',
            message: 'Entering'
          }
          // // call scanIn() method from server
          Meteor.call('scanIn',card.barcode,new Date(),"Security Scan",0.00,[],Meteor.userId());

          Session.set('current_approve_card',card)
          Session.set('current_current_approve_card_status',scan_in_sms)
        }
      }
      else{
        expires_card = {
          class: 'card_expire',
          message: 'Card has expired !'
        }
        Session.set('current_approve_card',card)
        Session.set('current_current_approve_card_status',expires_card)
      }
    }
    // Invalid card
    else{
      invalid_card = {
        class: 'invalid',
        message: 'Invalid Card !'
      }

      Session.set('current_approve_card',INVALID_CARD)
      Session.set('current_current_approve_card_status',invalid_card)
    }
    // Clear form
    event.target.barcode.value = "";
  }

});
