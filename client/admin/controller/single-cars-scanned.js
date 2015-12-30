Template.singleCardScanned.helpers({
  scanneds: function (cardnumber) {
    scanneds =  Scans.find({'cardnumber':cardnumber},{sort: {scantimes : -1}}).fetch()
    return scanneds
  }
});

Template.cardCurrentlyOnCampus.events({

});
