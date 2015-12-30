Template.cardsList.helpers({
  cards_list: function () {
    cards =  Cards.find({}).fetch()
    console.log(cards)
    return cards
  }
});

Template.cardCurrentlyOnCampus.events({

});
