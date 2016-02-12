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
Meteor.publish("images", function () {
  return Images.find();
});
Meteor.publish("zip", function () {
  return Zipper.find();
});
Cards._ensureIndex({barcode: 1}, {unique: 1});
