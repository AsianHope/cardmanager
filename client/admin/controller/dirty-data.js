Template.dirtyData.helpers({
  'did_not_exit_multiple_day' : function(){
    var days = 2; // Days you want to subtract
    var date = new Date();
    var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
    scan =  Scans.find({
        $and :[
          {'action':'Security Scan'},
          {'scantimes.1':null},
          {'scantimes.0':{$lte:last}}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
      return scan
  },
  getCardByBarcode:function(cardnumber){
    var result = Cards.findOne({'barcode':cardnumber});
    return result;
  },
});

Template.dirtyData.events({

});
