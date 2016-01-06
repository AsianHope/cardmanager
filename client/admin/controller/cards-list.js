Template.cardsList.helpers({
  cards_list: function () {
    cards =  Cards.find({}).fetch()
    return cards
  }
});

Template.cardCurrentlyOnCampus.events({

});
