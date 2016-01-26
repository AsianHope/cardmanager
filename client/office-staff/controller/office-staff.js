Template.officeStaff.events({
  'change #expire_period':function(event){
    var expire_period = $(event.target).val();
    var now = new Date();
    var date_after = new Date();
    date_after.setMonth(now.getMonth() + expire_period);
    $("#expires_date").val(moment(date_after).format("YYYY-MM-DD"));
  },
  'submit .new_card': function(event, template) {
    event.preventDefault();
    var barcode = event.target.barcode.value;
    var name = event.target.name.value;
    var type = event.target.type.value;
    var expires = event.target.expires.value;
    var associations = event.target.associations.value;
    // generate associations string to array split by commas
    if (associations){
      var array_of_associations = associations.split(',');
    }
    else{
      var array_of_associations = [];
    }

    var files = $('.myFileInput').get(0).files[0];
    // if file defined
    if (files){
      var fileObj = new FS.File(files);
      fileObj.name(barcode+"."+fileObj.extension());
      // set file name
       Images.insert(fileObj, function (err, Obj) {
         if (err){
           Session.set('add_new_card_message','Fail to upload file !');
         }
         else{
           var filename = Obj.collectionName+"-"+Obj._id+"-"+Obj.name();
           Meteor.call('create_new_card', barcode,name,type,expires,array_of_associations,filename, function (error, result) {
             if(error){
               Session.set('add_new_card_message',error.reason);
             }
             else {
               Meteor.defer(function() {
                 Router.go('singleCard', {barcode: barcode});
               });
               Session.set('add_new_card_message','');

             }
          });
         }
       });
    }
    // if file undefined
    else{
      Session.set('add_new_card_message','No file selected !');
    }
    return false;
  }
});

Template.officeStaff.helpers({
  type: function () {
    type =  BADGE_TYPE;
    return type;
  },
  add_new_card_message: function(){
    return Session.get('add_new_card_message');
  }
});

// upgrade mdl for office staff menu
Template.officeStaffMenu.onRendered(function () {
	componentHandler.upgradeAllRegistered();
});
