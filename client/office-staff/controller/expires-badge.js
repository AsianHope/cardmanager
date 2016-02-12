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
  },
  'click .renew': function(e, t) {
    var id = $(e.currentTarget).data('id');

    var expire_period = $("#renew_period").val() ? $("#renew_period").val() : 1;
    var now = moment(new Date());//new Date();
    var date_after = now.add(expire_period, 'months');//new Date();
    //date_after.setMonth(now.getMonth() + expire_period);
    var expire_date = moment(date_after).format("YYYY-MM-DD");
    Meteor.call('expire_card',id,expire_date);
  }
});
