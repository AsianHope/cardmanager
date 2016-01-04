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
      if (this.isInsert) {
        return [new Date()];
      }
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
	regEx: SimpleSchema.RegEx.Id,
	autoValue: function () {
	  if (this.isInsert) {
	    return Meteor.userId();
	  }
	},
    autoform: {
      options: function () {
        _.map(Meteor.users.find().fetch(), function (user) {
          return {
            label: user.emails[0].address,
            value: user._id
          };
        });
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
    Scans: {},
    Actions: {},
    Products: {},
  },
}


Cards.helpers({
  link: function() {
	  var barcode = Cards.find({_id: this._id }).fetch()[0].barcode;
	  return '<a href="/admin/card-scanned/'+ barcode +'">'+ barcode +'</a>';
  }
});