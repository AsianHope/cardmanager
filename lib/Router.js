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
