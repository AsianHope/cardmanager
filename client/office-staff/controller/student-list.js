Template.studentList.events({

});

Template.studentList.helpers({
  students: function () {
    return Cards.find({'type':'Student'}).fetch();
  }
});
