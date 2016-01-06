
var admin_default_scan_message = {
  class: '',
  message: ''
}

Session.set('admin_scan_message',admin_default_scan_message)
Session.set('admin_current_card',DEFAULT_CARD)

Template.dirtyData.helpers({
  'did_not_exit_multiple_day' : function(){
    var days = 2; // Days you want to subtract
    var date = new Date();
    var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
    scan =  Scans.find({
        $and :[
          {'action':'Security Scan'},
          { $or:[{'scantimes': { $size: 1 }},{'scantimes.1':null}] },
          {'scantimes.0':{$lte:last}}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
      Session.set('did_not_exit_multiple_day',scan)
      return scan
  },
  getCardByBarcode:function(cardnumber){
    var result = Cards.findOne({'barcode':cardnumber});
    return result;
  },
  cards_scan_out_and_in_immediately : function(){
    scan_out_in_immediately = []
    all_cards = Cards.find({}).fetch()
    for (var key in all_cards) {
      scanneds = Scans.find({'cardnumber':all_cards[key].barcode},{sort: {'scantimes.0' : 1}}).fetch()
      if(scanneds.length > 0 ){
        for(var i = 0 ; i <  scanneds.length; i++){
          if (scanneds[i+1] != undefined){
            //scan out and scan in duration less then 3 minutes
            if(scanneds[i+1].scantimes[0] - scanneds[i].scantimes[1] <= 180000 && scanneds[i+1].scantimes[0] - scanneds[i].scantimes[1] >= 0){
              scan_out_in_immediately.push([scanneds[i],scanneds[i+1]])
            }
          }
        }
      }
    }
    return scan_out_in_immediately
  },
  scans : function(){
    scans =  Scans.find({
        $and :[
          {'action':'Security Scan'},
          { $and:[{ $where: "this.scantimes.length > 1" },{'scantimes.1':{$ne:null}} ] }
        ]
      },
      {sort: {scantimes : -1}}).fetch()
    return scans
  },
  admin_scan_message : function(){
    return Session.get('admin_scan_message')
  },
  admin_current_card : function(){
    return Session.get('admin_current_card')
  }
});
Template.dirtyData.events({
  "click #scan_out": function (e) {
    e.preventDefault();
    did_not_exit_multiple_day =  Session.get('did_not_exit_multiple_day')
    var IDs = did_not_exit_multiple_day.map(function(card) { return card._id });
    Meteor.call('ScanOutCardsDidNotExitCampus',IDs);
  },
  "submit #admin_badge_in_or_badge_out": function (e) {
      e.preventDefault();
      var barcode = event.target.barcode.value;
      card = Cards.findOne({'barcode':barcode})
      if (card){
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
            class: 'admin_scan_out',
            message: 'Scan out !'
          }

          // call scanOut method from server
          Meteor.call('scanOut',scan._id,new Date())

          Session.set('admin_current_card',card)
          Session.set('admin_scan_message',scan_out_sms)
        }
        // scan in
        else{
          scan_in_sms = {
            class: 'admin_scan_in',
            message: 'Scan in !'
          }
          // call scanIn() method from server
          Meteor.call('scanIn',card.barcode,new Date(),"Security Scan",0.00,[],Meteor.userId());

          Session.set('admin_current_card',card)
          Session.set('admin_scan_message',scan_in_sms)
        }
      }
      // Invalid card
      else{
        invalid_card = {
          class: 'invalid_card',
          message: 'Invalid Card !'
        }

        Session.set('admin_current_card',INVALID_CARD)
        Session.set('admin_scan_message',invalid_card)

      }
    }
});
