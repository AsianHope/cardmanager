Cards = new Mongo.Collection("cards");
Scans = new Mongo.Collection("scans"); //history of scanned cards
CardsOnCampus = new Mongo.Collection("cardsoncampus"); //current system state, who is on campus
Actions = new Mongo.Collection("actions"); //history of scanned cards
Products = new Mongo.Collection("products");

// Define schemas.
Schemas = {};

Schemas.Cards = new SimpleSchema({
  type: {
    type: String,
    max: 60,
    optional: true
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

Cards.attachSchema(Schemas.Cards)
Actions.attachSchema(Schemas.Actions)
Scans.attachSchema(Schemas.Scans)
Products.attachSchema(Schemas.Products)

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