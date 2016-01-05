
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
