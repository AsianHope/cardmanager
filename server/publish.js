// This code only runs on the server
Meteor.publish("cards", function () {
  return Cards.find();
});
Meteor.publish("scans", function () {
  return Scans.find();
});
Meteor.publish("cardsoncampus", function () {
  return CardsOnCampus.find();
});
