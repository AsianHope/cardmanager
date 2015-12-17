Meteor.startup(function(){
  var existing_cards = Cards.findOne();
  //if there's no data, please load some test data
  if(!existing_cards){
    var cards = JSON.parse(Assets.getText('fixtures/cards.json'));
    _.each(cards, function(card){
      Cards.insert(card);
    });
  }
});


Meteor.methods({
  getCard: function(text){
    card = Cards.findOne({
      cardnumber: text,
      barcode: {$regex: /first/}
    });
    console.log(text);
    if(card == null){
      card =
          {
          	"name": "Card Not Found!",
          	"barcode": "XXX",
          	"associations": [
          	],
          	"expires": "XXXX-XX-XX"
          };
    }
    console.log("returning: "+card.name)
    Session.set("currentcard", card);
  }
});
