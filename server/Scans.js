
Meteor.methods({
  'scanIn' : function(barcode,enter_date,action,value,products,user){
    Scans.insert({
      "cardnumber": barcode,
      "scantimes": [enter_date],
      "action" : action,
      "value": value,
      "products": products,
      "user": user
    })
  },
  'scanOut' : function(id,exit_date){
    Scans.update(
      {_id :id},
      {$set: {'scantimes.1': exit_date }}
    );
  }
});
