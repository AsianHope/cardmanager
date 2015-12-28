var now = new Date();
// get datetime before 5 hours
now.setHours(now.getHours()-5);
var start = JSON.stringify(now)
var end =  JSON.stringify(new Date());

Session.set("view_startdate",start);
Session.set("view_enddate",end);

Template.who_on_campus_in_specific_time.helpers({
  scans_in_specific_time: function () {
    var startdate = Session.get("view_startdate")
    var enddate = Session.get("view_enddate")
    return  Scans.find({
        $and :[
          {'action':'Security Scan'},
          {$or:[
            {$and:[
              {'scantimes.0':{$gte:JSON.parse(startdate)}},{'scantimes.1':{$lte:JSON.parse(enddate)}}
            ]},
            {'scantimes.1':null}
          ]}
        ]
      },
      {sort: {scantimes : -1}}).fetch()
  },
  view_startdate : function(){
    var startdate = JSON.parse(Session.get('view_startdate'));
    if(startdate){
      if (moment) {
               return moment(startdate).format("MMM Do YYYY, h:mm:ss A");
           }
           else {
               return startdate;
           }
    }
    else{
      return null;

    }
  },
  view_enddate : function(){
    var enddate = JSON.parse(Session.get('view_enddate'));
    if(enddate){
      if (moment) {
               return moment(enddate).format("MMM Do YYYY, h:mm:ss A");
           }
           else {
               return enddate;
           }
    }
    else{
      return null;

    }
  },
  getCardByBarcode:function(cardnumber){
    var result = Cards.findOne({'barcode':cardnumber});
    return result;
  }
});

Template.who_on_campus_in_specific_time.events({
  "submit form": function (e) {
    e.preventDefault();
    var startdate = JSON.stringify(new Date(event.target.startdate.value));
    var enddate = JSON.stringify(new Date(event.target.enddate.value));
    var start = event.target.startdate.value;
    var end = event.target.enddate.value;
    Session.set("view_startdate",startdate);
    Session.set("view_enddate",enddate);
  }
});
