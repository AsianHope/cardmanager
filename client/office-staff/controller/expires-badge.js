Template.expiresBadge.helpers({
  'badges':function(){
    return Cards.find({}).fetch();
  }
});

Template.expiresBadge.events({


});
