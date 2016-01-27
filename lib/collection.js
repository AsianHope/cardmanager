Cards = new Mongo.Collection("cards");
Scans = new Mongo.Collection("scans"); //history of scanned cards
CardsOnCampus = new Mongo.Collection("cardsoncampus"); //current system state, who is on campus
Actions = new Mongo.Collection("actions"); //history of scanned cards
Products = new Mongo.Collection("products");
LoginDates = new Mongo.Collection('logindates');
FailedAttempts = new Mongo.Collection('failedattempts');

// find base path
fullpath="public/StudentPhotos";
if (Meteor.isServer) {
  fullpath=process.env.PWD;
  if( typeof fullpath == 'undefined' ){
    base_path = Meteor.npmRequire('fs').realpathSync( process.cwd() + '../../' );
    base_path = base_path.split('\\').join('/');
    base_path = base_path.replace(/\/\.meteor.*$/, '');
  }
   else{
    base_path=fullpath;
  }
}
else{
 base_path="/";
}

Images = new FS.Collection("images", {
    stores: [
      new FS.Store.FileSystem("image", {path:base_path+"/public/StudentPhotos"})
    ]
});


// Define schemas.
Schemas = {};

Schemas.Cards = new SimpleSchema({
  type: {
    type: String,
    max: 60
  },
  associations: {
	type: [String],
	optional: true
  },
  barcode: {
	type: String,
	max: 60
  },
  name: {
	type: String,
	max: 120
  },
  expires: {
	type: String,
	max: 60,
	optional: true
  },
  profile: {
  type: String,
  optional: true
  }
});


Schemas.Scans = new SimpleSchema({
  cardnumber: {
    type: String,
    max: 60
  },
  scantimes: {
	type: [Date],
	max: 2,
    autoValue: function () {
      //if (this.isInsert) {
      //  return [new Date()];
      //}
    }
  },
  action: {
	type: String,
	max: 60
  },
  value: {
    type: Number,
    decimal: true,
    min: 0
  },
  products: {
	type: [Products],
	optional: true
  },
  user: {
	type: String,
	autoValue: function () {
      if (this.isInsert) {
        if (this.userId) {
          return Meteor.users.find({'_id': this.userId}).fetch()[0].username;
        }
      }
	},
    autoform: {
      type: "select",
      options: function () {
        return Meteor.users.find().map((doc) => ({
          label: doc.username,
          value: doc.username,
        }))
      }
    }
  }
});

Schemas.Actions = new SimpleSchema({
  string: {
    type: String,
    max: 60
  },
  states: {
	type: [String]
  }
});


Schemas.Products = new SimpleSchema({
  sku: {
    type: String,
    max: 60
  },
  description: {
	type: String
  },
  value: {
	type: Number,
	decimal: true,
	min: 0
  }
});

Schemas.LoginDates = new SimpleSchema({
  daysOfWeek: {
    type: [String],
    autoform: {
      type: "select-checkbox",
      options: function () {
        return [
          {label: "Monday", value: "Monday"},
          {label: "Tuesday", value: "Tuesday"},
          {label: "Wednesday", value: "Wednesday"},
          {label: "Thursday", value: "Thursday"},
          {label: "Friday", value: "Friday"},
          {label: "Saturday", value: "Saturday"},
          {label: "Sunday", value: "Sunday"}
        ];
      }
    }
  },
  hoursOfDay: {
    type: [Number],
    autoform: {
      type: "select-checkbox",
      options: function () {
        return [
          {label: "00", value: 0},
          {label: "01", value: 1},
          {label: "02", value: 2},
          {label: "03", value: 3},
          {label: "04", value: 4},
          {label: "05", value: 5},
          {label: "06", value: 6},
          {label: "07", value: 7},
          {label: "08", value: 8},
          {label: "09", value: 9},
          {label: "10", value: 10},
          {label: "11", value: 11},
          {label: "12", value: 12},
          {label: "13", value: 13},
          {label: "14", value: 14},
          {label: "15", value: 15},
          {label: "16", value: 16},
          {label: "17", value: 17},
          {label: "18", value: 18},
          {label: "19", value: 19},
          {label: "20", value: 20},
          {label: "21", value: 21},
          {label: "22", value: 22},
          {label: "23", value: 23}
        ];
      }
    }
  }
});

Schemas.FailedAttempts = new SimpleSchema({
  IP: {
    type: String,
    max: 120
  },
  count: {
    type: Number,
    optional: true,
    defaultValue: 0
  },
  banned: {
    type: Number,
    optional: true,
    defaultValue: 0
  }
});

Cards.attachSchema(Schemas.Cards)
Actions.attachSchema(Schemas.Actions)
Scans.attachSchema(Schemas.Scans)
Products.attachSchema(Schemas.Products)
LoginDates.attachSchema(Schemas.LoginDates)
FailedAttempts.attachSchema(Schemas.FailedAttempts);

AdminConfig = {
  collections: {
    Cards: {
      //icon: 'comment',
      //omitFields: ['updatedAt']
      tableColumns: [
        { label: 'Barcode', name: 'link()'},
    	{ label: 'Name', name: 'name' },
    	{ label: 'Associations', name: 'associations'},
    	{ label: 'Expires', 'name': 'expires'}
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
      //showWidget: false,
      color: 'red'
    },
    Scans: {
      tableColumns: [
        { label: 'Barcode', name: 'cardnumber'},
      	{ label: 'Scan Times', name: 'scantimes' },
      	{ label: 'Action', name: 'action'},
      	{ label: 'User', 'name': 'user'}
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
    },
    Actions: {
      tableColumns: [
        { label: 'Name', name: 'string'},
        { label: 'Action types', name: 'states' }
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
    },
    Products: {
      tableColumns: [
        { label: 'Sku', name: 'sku'},
        { label: 'Description', name: 'description' },
        { label: 'Value', name: 'value'}
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
    },
    LoginDates: {
      tableColumns: [
        { label: 'Days of Week', name: 'daysOfWeek'},
        { label: 'Hours of Day', name: 'hoursOfDay'}
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
    },
    FailedAttempts: {
      tableColumns: [
        { label: 'IP Address', name: 'IP'},
        { label: 'Attempts', name: 'count'}
      ],
      showEditColumn: true, // Set to false to hide the edit button. True by default.
      showDelColumn: true, // Set to false to hide the edit button. True by default.
    },
  },
  // Use a custom SimpleSchema:
  userSchema: new SimpleSchema({
    'cardnumber': {
      type: String,
      optional: true,
      autoform: {
        type: "select",
        options: function () {
          // return cards that haven't been used by other users.
          var ids = Meteor.users.find({'_id': {$ne: Router.current().params._id}}).map(function(c) { return c.cardnumber });
          return Cards.find({'type': "Terminal", 'barcode': {$nin: ids}}).map((doc) => ({
            label: doc.name,
            value: doc.barcode,
          }))
        }
      }
    },
    'profile.loginFailedAttempt': {
      type: Number,
      optional: true,
      defaultValue: 0
    },
    'profile.loginBlockSet': {
      type: String,
      optional: true
    }
  })
}

// Used in admin config settings.
Cards.helpers({
  link: function() {
	  var barcode = Cards.find({_id: this._id }).fetch()[0].barcode;
	  return '<a href="/admin/card-scanned/'+ barcode +'">'+ barcode +'</a>';
  }
});

// Methods on both clients/server
Meteor.methods({
  disconnectUser: function (taskId) {
	// make sure only authorized users can set logout
    var loggedInUser = Meteor.user();
    if (!Roles.userIsInRole(loggedInUser, ['admin','staff'])) {
      throw new Meteor.Error("not-authorized");
    }
	Meteor.users.update(taskId, {$set : { "services.resume.loginTokens" : [] }}, {multi:true});
  }
});
