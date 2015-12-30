Router.configure({
    layoutTemplate: 'mainLayout'
});
Router.route('/', {
    name: 'scanCard'
});
Router.route('/admin', {
    name: 'admin'
});
Router.route('/admin/card-currently-on-campus', {
    name: 'cardCurrentlyOnCampus'
});
Router.route('/admin/cards-list', {
    name: 'cardsList'
});
Router.route('/admin/card-scanned/:barcode', {
    name: 'singleCardScanned',
    data: function(){
      return Cards.findOne({'barcode':this.params.barcode})
     }
});
