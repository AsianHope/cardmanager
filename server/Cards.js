
Meteor.methods({
  'create_new_card' : function(barcode,name,type,expires,associations,profile){
    Cards.insert({
      "barcode": barcode,
      "name": name,
      "type":type,
      "expires" : expires,
      "associations": associations,
      "profile" : profile
    })
  }
});
