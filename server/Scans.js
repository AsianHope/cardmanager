
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
  },
  'bulk_insert_update_scans':function(scan_list){
    scan_list.forEach(function(data) {
        scan = Scans.findOne({
          "_id":data["_id"]
        })
        if ((scan == undefined) || (scan == 'undefined')){
          Scans.insert({
            "_id": data["_id"],
            "cardnumber": data["cardnumber"],
            "scantimes": data["scantimes"],
            "action" : data["action"],
            "value": data["value"],
            "products": data["products"],
            "user": data["user"]
          })
        }
        else{
          if ((data["scantimes"].length >1) && data["scantimes"][1] != null){
            Scans.update(
              {_id :data["_id"]},
              {$set: {'scantimes': data["scantimes"] }}
            );
          }
        }
      });
  },
  'bulk_insert_update_lunch_scans':function(scan_list){
    scan_list.forEach(function(data) {
        scan = Scans.findOne({
          "_id":data["_id"]
        })
        if ((scan == undefined) || (scan == 'undefined')){
          Scans.insert({
            "_id": data["_id"],
            "cardnumber": data["cardnumber"],
            "scantimes": data["scantimes"],
            "action" : data["action"],
            "value": data["value"],
            "products": data["products"],
            "user": data["user"]
          })
        }
      });
  }
});
