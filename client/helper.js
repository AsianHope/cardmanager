
//handle dates with momentjs
Template.registerHelper('formatDate', function(date) {
  if(date){
    if (moment) {
             return moment(date).format("MMM Do YYYY, h:mm:ss A");
         }
         else {
             return date;
         }
  }
  else{
    return null;

  }
});

Template.registerHelper('since', function(date) {
  if(date != null)
    return moment(date).fromNow();
  else
    return null;
});
Template.registerHelper('duration', function(date1,date2) {
  if(date1 != null && date2 != null)
    return moment.duration(date1 - date2).humanize();
  else
    return null;
});
Template.registerHelper('isOnCampusMultipleDay', function(date1,date2) {
  if(date1 != null && date2 != null){
    if(moment.duration(date1-date2).asHours() > 24){
      return true;
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
});

// Override yogiben:admin's change password onsuccess hook
AutoForm.addHooks(['adminChangePassword'], {
  beginSubmit: function() {
    return $('.btn-primary').addClass('disabled');
  },
  endSubmit: function() {
    return $('.btn-primary').removeClass('disabled');
  },
  onError: function(formType, error) {
    return AdminDashboard.alertFailure(error.message);
  }
}, true);

AutoForm.hooks({
  adminChangePassword: {
    onSuccess: function(operation, result, template) {
      AdminDashboard.alertSuccess('Password reset');
      return Router.go('/admin/Users');
    }
  }
});
