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


Template.cardsUpdate.onCreated(function() {
  this.lastSummary = new ReactiveVar(null);
});

Template.cardsUpdate.helpers({
  zipsummary: function() {
    return Template.instance().lastSummary.get();
  },
  extend: function () {
    return Session.get("extend");
  },
})

Template.cardsUpdate.events({
  "change .toggle-extend": function (event) {
    Session.set("extend", event.target.checked);
   },
  "click #read_zip" : function(event,template) {
	event.preventDefault();
	var f = template.find("#zipfileInput").files[0];
	var summary = '';
	var extend = Session.get("extend");
	var expire_period = $("#renew_period").val() ? $("#renew_period").val() : 1;

    if (f) {
      var fileObj = new FS.File(f);
      var fileId;
      var extension = fileObj.extension();
      
      if (extension != 'zip') {
        template.lastSummary.set("Uploaded file needs to be a zip.");
        return;
      }
      
      Zipper.insert(fileObj, function (err, Obj) {
        if (err){
          console.log('failed to upload zip');
          return;
	    }
        else{
          Obj.on('uploaded', function() {
            fileId = Obj._id;
            var filename = Obj.collectionName+"-"+Obj._id+"-"+Obj.name();
            Meteor.call('update', filename, extend, expire_period, function(error, result) {
              if (error) {
                console.log(error);
                return;
              }
              else {
                //@todo: remove zip
            	/*
            	   Zipper.findOne(fileId).remove() works, but the update button is still clickable and will crash
            	   the app
            	 */
                
                template.lastSummary.set(result);
		        alert(result);
		        
		        // can't use nice modal here, only alert will stop page refresh.
		        // $('#summaryModal').modal('show');
		      }
            });
          })
        }
      });
    }
  }
})