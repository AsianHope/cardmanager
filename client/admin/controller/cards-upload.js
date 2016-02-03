Template.cardsUpload.events({
 "click #read_cards" : function(event,template) {
  event.preventDefault();
  var f = template.find("#fileInput").files[0]; //document.getElementById('fileInput').files[0];
  readFile(f, function(content) {
    Meteor.call('upload',content);
  });
  return Router.go('/admin/Cards');
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