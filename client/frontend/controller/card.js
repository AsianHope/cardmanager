Template.association.helpers({
  'get_association':function(barcode){
    return Cards.findOne({'barcode':barcode});
  }
});
