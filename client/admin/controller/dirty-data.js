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
          {'scantimes.1':{$ne:null}}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
    return scans
  }
});
Template.dirtyData.events({

});
