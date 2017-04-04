var today =  new Date();
Session.set("select_date",today);

Template.LunchScansReport.helpers({
  lunch_scans: function () {
    var start = Session.get("select_date");
    var end = Session.get("select_date");
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999)
    return Scans.find(
        {$and:[
                {'action':'Lunch Scans'},
                {'scantimes.0':{$gte:start}},{'scantimes.0':{$lte:end}}
              ]
        },
        {sort: {'scantimes.0' : -1}}
    ).fetch();
  },
  getCardByBarcode:function(cardnumber){
      var result = Cards.findOne({'barcode':cardnumber});
      return result;
  },
  get_select_date : function(){
    var date = Session.get('select_date');
    if(date){
      if (moment) {
        return moment(date).format("MMM Do YYYY");
      }
      else {
        return date;
      }
    }
    else{
      return null;
    }
  },
})

Template.LunchScansReport.events({
  "change #filter_by_date": function (e) {
    e.preventDefault();
    var date = $(e.target).val();
    Session.set("select_date",new Date(date));
  }
});
