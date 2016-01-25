Template.expiresBadge.helpers({
  'badges':function(){
    return Cards.find({}).fetch();
  },
  'is_expired':function(expires_date){
    var today =  moment(new Date()).format("YYYY-MM-D");
    if(expires_date <= today){
      return true;
    }
    else{
      return false;
    }
  }
});

Template.expiresBadge.events({
  'click .expires': function(e, t) {
    var id = $(e.currentTarget).data('id');
    var today =  moment(new Date()).format("YYYY-MM-D");
    Meteor.call('expire_card',id,today);
  }
});
