
Meteor.methods({
  'scanIn' : function(barcode,action,value,products,user,enter_date=new Date()){
    Scans.insert({
      "cardnumber": barcode,
      "scantimes": [enter_date],
      "action" : action,
      "value": value,
      "products": products,
      "user": user
    })
  },
  'scanOut' : function(id,exit_date = new Date()){
    Scans.update(
      {_id :id},
      {$set: {'scantimes.1': exit_date }}
    );
  },
  'get_scan':function(barcode){
    return Scans.findOne({
      $and:[
        {'cardnumber':barcode},
        {'action':'Security Scan'},
        { $or:[{'scantimes': { $size: 1 }},{'scantimes.1':null}] }
      ]},
      {sort: {'scantimes.0' : -1}
    })
  }
});
