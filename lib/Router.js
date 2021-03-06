// Set staff filter.
var isStaff = function() {
    if (Roles.userIsInRole(Meteor.userId(), ["staff","admin"])) {
        this.next();
    }
    else {
        //this.redirect("/error");
    	this.render('NotAuth');
    }
};

// Apply staff filter to select routes.
Router.onBeforeAction(isStaff, {
  only: [
    "officeStaff",
    "singleCard",
    "printCard",
    "approveBadge",
    "expires-badge",
    "student-list",
    "associateWithBadge"
  ]
});

Router.configure({
    layoutTemplate: 'mainLayout'
});
Router.route('/', {
    name: 'scanCard'
});
Router.route('/officeStaff', {
    name: 'officeStaff'
});
// Router.route('/card/:barcode', {
//     name: 'singleCard'
// });
Router.route('/card/:barcode', {
    name: 'singleCard',
    template: 'singleCard',
    data: function(){
      return Cards.findOne({'barcode':this.params.barcode})
     }
});
Router.route('/print', {
    name: 'printCard',
    template: 'printCard'
});
Router.route('/approveBadge', {
    name: 'approveBadge',
    template: 'approveBadge'
});
Router.route('/expires-badge', {
    name: 'expires-badge',
    template: 'expiresBadge'
});
Router.route('/student-list', {
    name: 'student-list',
    template: 'studentList'
});
Router.route('/associate/:barcode', {
    name: 'associateWithBadge',
    template: 'associateWithBadge',
    data: function(){
      return Cards.findOne({'barcode':this.params.barcode})
     }
});
Router.route('/daily-lunch-scans', {
    name: 'LunchScansReport',
    template: 'LunchScansReport',
});
// Router.route('/admin/reports', {
//     name: 'reports', // change name to admin to use dashboard theme
//     template: 'admin'
// });
//
// Router.route('/admin/card-currently-on-campus', {
//     name: 'cardCurrentlyOnCampus'
// });
//
// Router.route('/admin/cards-list', {
//     name: 'cardsList',
//     action: function() {
//         this.render("cards-list");
//     }
// });
// Router.route('/admin/card-scanned/:barcode', {
//     name: 'singleCardScanned', // change name to admin to use dashboard theme
//     template: 'singleCardScanned',
//     data: function(){
//       return Cards.findOne({'barcode':this.params.barcode})
//      }
// });


AdminDashboard.addSidebarItem('Reports', {
	  icon: 'line-chart',
	  urls: [
	    { title: 'Cards on campus', url: AdminDashboard.path('/card_on_campus_in_specific_time') },
	    { title: 'Cards currently on campus', url: AdminDashboard.path('/card-currently-on-campus') },
	    { title: 'Cards list', url: AdminDashboard.path('/cards-list') },
      { title: 'Dirty Data', url: AdminDashboard.path('/dirty-data') },

	  ]
	});

AdminDashboard.addSidebarItem('Connections', {
	  icon: 'users',
	  urls: [
	    { title: 'Terminals', url: AdminDashboard.path('/terminals-list') },

	  ]
	});


// To use links with dashboard theme, uncomment here and comment above routes.

Router.route('card-currently-on-campus', {
	  path: AdminDashboard.path('card-currently-on-campus'),
	  controller: 'AdminController',
	  onAfterAction: function () {
	    Session.set('admin_title', 'Cards currently on campus');
	  }
	});
Router.route('cards-list', {
	  path: AdminDashboard.path('cards-list'),
	  controller: 'AdminController',
	  onAfterAction: function () {
	    Session.set('admin_title', 'Cards list');
	  }
	});
Router.route('terminals-list', {
	  path: AdminDashboard.path('terminals-list'),
	  controller: 'AdminController',
	  onAfterAction: function () {
	    Session.set('admin_title', 'Terminals list');
	  }
	});
Router.route('card_on_campus_in_specific_time', {
      path: AdminDashboard.path('card_on_campus_in_specific_time'),
      controller: 'AdminController',
      onAfterAction: function () {
        Session.set('admin_title', 'Cards on campus');
      }
});
Router.route('single-card-scanned', {
      path: AdminDashboard.path('card-scanned/:barcode'),
      controller: 'AdminController',
      onAfterAction: function () {
        Session.set('admin_title', 'Card scanned');
      },
      data: function(){
            return Cards.findOne({'barcode':this.params.barcode})
           }
});
Router.route('dirty-data', {
      path: AdminDashboard.path('dirty-data'),
      controller: 'AdminController',
      onAfterAction: function () {
        Session.set('admin_title', 'Dirty data');
      },
      data: function(){
            return Cards.findOne({'barcode':this.params.barcode})
           }
});

AdminDashboard.addCollectionItem(function (collection, path) {
  if (collection === 'Cards') {
    return {
      title: 'Upload',
      url: path +'/cards-upload'
    };
  }
});

Router.route('cards-upload', {
  path: AdminDashboard.path('Cards/cards-upload'),
  controller: 'AdminController',
  onAfterAction: function () {
    Session.set('admin_title', 'Upload CSV/Zip');
  }
});

// Use this only for local development to see images
/*
Router.route('/static/:filename(.*)', function (){
    var fs = Npm.require('fs'),
        path = Npm.require('path'),
        params = this.params,
        filePath = path.join(process.env.PWD, '..', 'static', params.filename);
    console.log('filepath is '+filePath)
    var chunk = fs.createReadStream(filePath);
    var headers = {}, // add Content-type, Content-Lenght etc. if you need
        statusCode = 200; // everything is OK, also could be 404, 500 etc.
    this.response.writeHead(statusCode, headers);
    chunk.pipe(this.response);
}, { where: 'server'});
*/
