Meteor.methods({
  'ScanOutCardsDidNotExitCampus' : function(list_of_id){
    Scans.update(
      {_id :{$in:list_of_id}},
      {$set: {'scantimes.1': new Date() }},
      {multi: true}
      );
  }
});
