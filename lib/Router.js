Router.configure({
    layoutTemplate: 'mainLayout'
});
Router.route('/', {
    name: 'scanCard'
});
Router.route('/admin', {
    name: 'admin'
});
