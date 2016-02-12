Meteor.startup(function(){
  
  // Testing: clear users each time.
  if (Meteor.users.find().count() !== 0) {
    console.log('not empty');
    //Meteor.users.remove({});
  }

  var existing_roles = Meteor.roles.findOne();
  //if there's no data, please load some test data
  if(!existing_roles){
    var roles = JSON.parse(Assets.getText('fixtures/roles.json'));
    _.each(roles, function(role){
      if (Meteor.roles.find({'name': role}).count() === 0) {
        Roles.createRole(role);
      }
    });
  }
  
  var existing_users = Meteor.users.findOne();
  //if there's no data, please load some test data
  if(!existing_users){
    var users = JSON.parse(Assets.getText('fixtures/users.json'));
    _.each(users, function(userData){
      var id, user;
	  console.log(userData);
	  id = Accounts.createUser({
	    email: userData.email,
	    username: userData.name.trim(), //toLowerCase().trim(),
	    password: "password",
	    profile: { name: userData.name },
	    cardnumber: userData.cardnumber ? userData.cardnumber : ''
	  });
	
      console.log(Meteor.users.find({_id: id}).fetch());
      //email verification
      Meteor.users.update({_id: id}, {$set:{'emails.0.verified': true}});
      Roles.addUsersToRoles(id, userData.roles, Roles.GLOBAL_GROUP);
    });
  }

  var existing_cards = Cards.findOne();
  var existing_scans = Scans.findOne();
  var existing_actions = Actions.findOne();
  //if there's no data, please load some test data
  if(!existing_cards){
    var cards = JSON.parse(Assets.getText('fixtures/cards.json'));
    _.each(cards, function(card){
      Cards.insert(card);
    });
  }
  if(!existing_scans){
    var scans = JSON.parse(Assets.getText('fixtures/scans.json'));
    _.each(scans, function(scan){
      Scans.insert(scan);
    });
  }
  if(!existing_actions){
    var actions = JSON.parse(Assets.getText('fixtures/actions.json'));
    _.each(actions, function(action){
      Actions.insert(action);
    });
  }
  ////////////////////////////////////////////////////////////////////
  //Prevent non-authorized users from creating new users
  //
  Accounts.validateNewUser(function (user) {
    var loggedInUser = Meteor.user();
    if (Roles.userIsInRole(loggedInUser, ['admin','staff'])) {
      return true;
    }
    throw new Meteor.Error(403, "Not authorized to create new users");
  });

});

// Set usernames to email address.
Accounts.onCreateUser(function(options, user) {
  user.username = user.emails ? user.emails[0].address : user.username;
  user.profile = options.profile ? options.profile : {};
  return user;  
});

var failAttemptCount = 5;
// Validate login attempts.
Accounts.validateLoginAttempt(function(info){
  var user = info.user;
  if (!user) {
	// This must be a terminal attempt.
    if (info.methodName == 'login' && info.methodArguments[0].cardnumber) {
       var ip = info.connection.clientAddress;
       var count = Meteor.call('failedTerminalLogin', ip);
       if (count == failAttemptCount) {
         Meteor.call('banIP', ip);
       }
    }
    return false;
  }
  // If there is a user, it's a normal user/password attempt.
  var failAttempt = 0;
  if (user.profile) {
    failAttempt = user.profile.loginFailedAttempt ? user.profile.loginFailedAttempt : 0;
  }
  var loginAllowed = false;
  if(info.error && info.error.error == 403){
    if(failAttempt >= failAttemptCount) {
      var now = moment(new Date()).format("x");
      Meteor.users.update({_id: user._id}, {$set: {'profile.loginBlockSet': now}});
      throw new Meteor.Error(403, 'You need to contact the admin!');
    }
    // increment the fail attempts
    failAttempt++;
    loginAllowed = false;
  }
  else {
    // Login is successful, but if a set amount of time since the block was set
    // hasn't elapsed why let them in?
    var loginBlockSet = user.profile.loginBlockSet ? user.profile.loginBlockSet : 0;
    if (loginBlockSet) {
      var now = moment(new Date()).format("x");
      // 1hr is 3600000 ms
      // 1m is 60000 ms
      if ((now - loginBlockSet) < 60000) {
        // Throw the same error and move on as usual.
        Meteor.users.update({_id: user._id}, {$set: {'profile.loginBlockSet': now}});
        throw new Meteor.Error(403, 'You need to contact the admin!');
      } 
    }
    // success login set to 0
    failAttempt = 0;
    loginAllowed = true;
  }
  Meteor.users.update({_id: user._id}, {$set: {'profile.loginFailedAttempt': failAttempt}});
  return loginAllowed;
});

// Login handler for terminals.
Accounts.registerLoginHandler(function(loginRequest) {
  var user, userId;
  if (!loginRequest.cardnumber) {
    return;
  }
  // If there are no loginDates set, terminals can login.
  var existing_dates = LoginDates.findOne();
  if (existing_dates) {
    // If there are existing dates, check the time.
    var now = moment();
    var day = "" + moment(now).format("dddd");
    var hour = Number(moment(now).format("H"));
    var dates = LoginDates.find({$and: [{daysOfWeek: day}, {hoursOfDay: hour}]}).count();
    if (dates === 0) {
       return undefined;
    }
  }
  user = Meteor.users.findOne({
    cardnumber: loginRequest.cardnumber
  });
  if (!user) {
    return undefined;
  } else {
    userId = user._id;
  }

  //creating the token and adding to the user
  var stampedToken = Accounts._generateStampedLoginToken();
  var hashStampedToken = Accounts._hashStampedToken(stampedToken);

  Meteor.users.update(userId, 
    {$push: {'services.resume.loginTokens': hashStampedToken}}
  );

  //sending token along with the userId
  return {
    userId: userId,
    token: stampedToken.token
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
  },
  failedTerminalLogin: function(ip) {
	var count = 1;
    if (FailedAttempts.find({"IP": ip}).count()) {
      count = FailedAttempts.find({"IP": ip}).fetch()[0].count;
      FailedAttempts.update({"IP": ip}, {$set: {'count': count +1}});
    }
    else {
      FailedAttempts.insert({
        "IP": ip,
        "count": count
      });
    }
    return count;
  },
  banIP: function(ip) {
    if (FailedAttempts.findOne({"IP": ip})) {
      count = FailedAttempts.find({"IP": ip}).fetch()[0].count;
      // Make sure to only ban once and write to file once.
      // Done by calling method at a certain count in validateLoginAttempt.
        FailedAttempts.update({"IP": ip}, {$set: {'banned': 1}});

	    var fs = Npm.require( 'fs' ) ;
	    var path = Npm.require( 'path' ) ;
	    
	    // Write ip to file
	    var app_path = fs.realpathSync('.');
	    var base_path = app_path.replace(/\/\.meteor.*$/, '');

	    if (!fs.existsSync(base_path)) {
	      throw new Error(myPath + " does not exists");
	    }
	    var file_path = path.join(base_path, 'banned_list.txt');
	     
	    var buffer = new Buffer( ip + '\n') ;
	    fs.appendFileSync( file_path, buffer ) ;
      }
  },
  upload : function(fileContent) {
    summary = import_file_cards(fileContent);
    return summary;
  },
  update: function(file, extend, expire_period) {
    var messages = '';
    var errors = '';
    var total_count = 0;
    var error_count = 0;
    var update_count = 0;
    var stats = {'errors': errors, 'messages': messages, 'total_count': total_count, 'error_count': error_count, 'update_count': update_count};

    var unzip = Meteor.npmRequire('unzip');
	var fs = Npm.require('fs');
	output = base_path+'/public/StudentPhotos/';


	if (!fs.existsSync(output)) {
	  fs.mkdirSync(output);
	}
	var response = Async.runSync(Meteor.bindEnvironment(function(done) {
	  fs.createReadStream(base_path+"/public/Zips/"+file)
	    .pipe(unzip.Parse())
	    .on('entry', Meteor.bindEnvironment(function (entry) {
	      var fileName = entry.path;
	      var type = entry.type; // 'Directory' or 'File'
	      var size = entry.size;
	      if (fileName.match(/(.jpg|.jpeg)$/i)) {
	        var barcode = fileName.replace(/(.jpg|.jpeg)$/i, '');
	        var exists = Cards.findOne( { barcode: barcode } );
	        if (!exists) {
	          error_count++;
	          total_count++;
	          errors += '\r\n No match for image: '+fileName;
	          stats = {'errors': errors, 'messages': messages, 'total_count': total_count, 'error_count': error_count, 'update_count': update_count};
	          entry.autodrain();
	        }
	        else {
	          var profile = fileName;
	          if (!extend) {
	            Cards.update(
	              {'barcode' :barcode},
	              {$set:
	                {
	            	  "profile": profile
	            	}
	            });
	          }
	          else {
	            var now = moment(new Date());
	            var date_after = now.add(expire_period, 'months');
	            var expire_date = moment(date_after).format("YYYY-MM-DD");
	            Cards.update(
	              {'barcode' :barcode},
	              {$set:
	                {
	                  "expires": expire_date,
	                  "profile": profile
	                }
	            });
	          }
	          
	          update_count++;
	          total_count++;
	          stats = {'errors': errors, 'messages': messages, 'total_count': total_count, 'error_count': error_count, 'update_count': update_count};
	          entry.pipe(fs.createWriteStream(output+fileName));
	        }
	      } 
	      else {
	        error_count++;
	        total_count++;
	        errors += '\r\n Image was not a jpg/jpeg format: '+fileName;
	        stats = {'errors': errors, 'messages': messages, 'total_count': total_count, 'error_count': error_count, 'update_count': update_count};
	        entry.autodrain();
	      }
	    })).on('close', function(close) {done(null, stats);});
	  }));
	  
	var summary = 'Out of ' + response.result.total_count + ' records, ' + response.result.update_count + ' records were updated';
	//messages = response.result.messages;
	if (response.result.error_count) {
		summary += '\r\n There were '+ response.result.error_count + ' errors as follows:'+response.result.errors;
	}
    return summary;
  }
});



import_file_cards = function(file) {
 var messages = '';
 var total_records = 0;
 var insert_records = 0;
 var error_records = 0;
 var update_records = 0;
 var current_record = 1;
 
 var lines = file.split(/\r\n|\n/);
 var l = lines.length - 1;
 total_records = l - 1;
 // Skip the first line, start at 1.
 for (var i=1; i < l; i++) {
  current_record = i;
  var line = lines[i];
  //var line_parts = line.split(',');
  var line_parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  line_parts = line_parts || [];
  
  var barcode = (line_parts[0] != undefined) ? line_parts[0].trim().replace(/(")/g, '') : null;
  var name = (line_parts[1] != undefined) ? line_parts[1].trim().replace(/(")/g, '') : null;
  var type = (line_parts[2] != undefined) ? line_parts[2].trim().replace(/(")/g, '') : null;
  var expires = (line_parts[3] != undefined) ? line_parts[3].trim().replace(/(")/g, '') : null;
  // Anything remaining has to be associations
  //var associations = '';
  var associations_array = [];
  for (var j = 4; j < line_parts.length; j++) {
    if (line_parts[j] != undefined && line_parts[j].trim().replace(/(")/g, '')) {
      associations_array.push(line_parts[j]);
	}
  }
  
  // Check values;
  is_valid_barcode = (barcode != null) && Match.test(barcode, String);
  is_valid_name = (name != null) && Match.test(name, String);
  is_valid_type = (type != null) && Match.test(type, String) && BADGE_TYPE.indexOf(type) != -1;

  var match_date = [];
  if (expires != null) {
    match_date = expires.match(/([0-9]{4})-([0-9]{2})-([0-9]{2})/g);
  }
  is_valid_expires = (match_date != null) && match_date.length;
  
  var status = 'record '+ current_record + ': bc: '+ is_valid_barcode+ ': name: '+ is_valid_name + 
    ': type: '+ is_valid_type + ': expires: '+ is_valid_expires;
  
  if (!is_valid_expires || !is_valid_type || !is_valid_barcode || !is_valid_name) {
	messages += 'Error on line ' + current_record + ': ' + line + '\r\n';
	error_records++;
	continue;
  }
  
  exists = Cards.findOne( { barcode: barcode } );
  if (!exists) {
	insert_records++;
    Cards.insert({
        "barcode": barcode,
        "name": name,
        "type":type,
        "expires" : expires,
        "associations": associations_array
      });
  }
  else {
	update_records++;
    Cards.update(
    	{'barcode' :barcode},
    	{$set: 
    	  {
    	   "name": name,
           "type":type,
           "expires" : expires,
           "associations": associations_array
          }
    	});
  }
  };
  var summary = 'Out of '+ total_records + ' records, ' + insert_records + ' were inserted and ' + update_records + 
    ' were updated. \r\n';
  if (error_records) {
    summary += 'There were ' + error_records + ' errors as follows: \r\n' + messages;
  }
  return summary;
}


