
Meteor.methods({
  'create_new_card' : function(barcode,name,type,expires,associations,profile){
    // check if barcode already exist
    if(Cards.findOne({barcode:barcode})) {
      throw new Meteor.Error(500, 'Barcode already exist!');
    }
    else {
      Cards.insert({
        "barcode": barcode,
        "name": name,
        "type":type,
        "expires" : expires,
        "associations": associations,
        "profile" : profile
      })
    }

  }
});
