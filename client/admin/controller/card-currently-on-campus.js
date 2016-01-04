Template.cardCurrentlyOnCampus.helpers({
  cards_currently_on_campus: function () {
    var badge_type = Session.get("badge_type_on_campus_now");
    if(badge_type){
      var badges = Cards.find({'type':badge_type}).fetch();
    }
    else {
      var badges = Cards.find({}).fetch();
    }
    var barcodes = badges.map(function(card) { return card.barcode });
    cards =  Scans.find({
        $and :[
          {'cardnumber': {$in: barcodes}},
          {'action':'Security Scan'},
          {'scantimes.1':null}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
    return cards
  },
  getCardByBarcode:function(cardnumber){
    var result = Cards.findOne({'barcode':cardnumber});
    return result;
  },
  badge_type : function(){
    return Session.get('badge_type_on_campus_now');
  }
});

Template.cardCurrentlyOnCampus.events({
  "change #filter_by_badge_type": function (e) {
    e.preventDefault();
    var badge_type = $(e.target).val();
    Session.set("badge_type_on_campus_now",badge_type);
  }
});
