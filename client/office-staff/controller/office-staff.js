Template.officeStaff.events({
  'submit .new_card': function(event, template) {
    event.preventDefault();
    var barcode = event.target.barcode.value;
    var name = event.target.name.value;
    var type = event.target.type.value;
    var expires = event.target.expires.value;
    var associations = event.target.associations.value;

    var array_of_associations = associations.split(',');
    console.log(array_of_associations)
    var files = $('.myFileInput').get(0).files[0];
    var fileObj = new FS.File(files);
    // set file name
    fileObj.name(barcode+"."+fileObj.extension());
     Images.insert(fileObj, function (err, Obj) {
       var filename = Obj.collectionName+"-"+Obj._id+"-"+Obj.name();
       Meteor.call('create_new_card',barcode,name,type,expires,array_of_associations,filename);
     });
  }
});

Template.officeStaff.helpers({
  type: function () {
    type =  BADGE_TYPE
    return type
  }
});
