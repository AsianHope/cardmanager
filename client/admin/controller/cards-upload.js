Template.cardsUpload.onCreated(function() {
  this.lastSummary = new ReactiveVar(null);
});

Template.cardsUpload.helpers({
  summary: function() {
    return Template.instance().lastSummary.get();
  }
})

Template.cardsUpload.events({
 "click #read_cards" : function(event,template) {
  event.preventDefault();
  var f = template.find("#fileInput").files[0];
  var summary = '';
  readFile(f, function(content) {
    Meteor.call('upload',content, function(error, result){
      if(error){
        console.log(error.reason);
        return;
      }
      template.lastSummary.set(result);
    });
  });
  //return Router.go('/admin/Cards');
 }
})

readFile = function(f,onLoadCallback) {
  //When the file is loaded the callback is called with the contents as a string
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents=e.target.result;
    onLoadCallback(contents);
  }
  reader.readAsText(f);
};