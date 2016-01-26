Session.set('assocassociate_student_messageiate_student_message','');
Template.associateWithBadge.events({
  'submit #associate':function(event){
    event.preventDefault();
    var student_barcode = event.target.student_barcode.value;
    var parent_barcode = event.target.parent_barcode.value;
    var student = Cards.findOne({'barcode':student_barcode,'type':'Student'});
    var parent = Cards.findOne({'barcode':parent_barcode,'type':'Parent'});
    if(student){
      if(parent){
        Meteor.call('add_association',parent.barcode,student.barcode,function(error){
          if(error){
            Session.set('associate_student_message','Fail to add association !');
          }
          else{
            Meteor.defer(function() {
              Router.go('singleCard', {barcode: parent.barcode});
            });
          }
        });
      }
      else{
        Session.set('associate_student_message','Parent not found !');
      }
    }
    else{
      Session.set('associate_student_message','Student not found !');
    }
  }
});
Template.associateWithBadge.helpers({
  parents: function () {
    return Cards.find({'type':'Parent'}).fetch();
  },
  associate_student_message:function(){
    return Session.get('associate_student_message');
  }
});
