Template.cardCurrentlyOnCampus.helpers({
  cards_currently_on_campus: function () {
    cards =  Scans.find({
        $and :[
          {'action':'Security Scan'},
          {'scantimes.1':null}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
    return cards
  },
  cards_currently_on_campus_total: function () {
    cards_total =  Scans.find({
        $and :[
          {'action':'Security Scan'},
          {'scantimes.1':null}
        ]
      },
      {sort: {scantimes : -1}}).count()
    return cards_total
  },
  getCardByBarcode:function(cardnumber){
    var result = Cards.findOne({'barcode':cardnumber});
    return result;
  },
});

Template.cardCurrentlyOnCampus.events({

});
