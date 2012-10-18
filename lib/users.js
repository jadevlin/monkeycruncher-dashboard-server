var db = require('./database');

// Loads a user from the db by username. Loads asynchronously, so takes a callback to execute when done.
// The first callback parameter is the error, if any, the second is the user. If the user was not found,
// even though the query executed successfully (i.e. they're not in the db), returns undefined for the user
// without error.
exports.findByUsername = function (username, callback) {
    findBySomething('username', username, callback);
};

// same as above, except loads from the ID
exports.findByUserID = function (userID, callback) {
    findBySomething('userID', userID, callback);
};

// user loading middleware, requires the userID in the session (i.e. that the user is logged in).
// loads the user in to the request locals object
exports.loadUser = function (request, response, next) {
     exports.findByUserID(request.session.userID, function(err, user) {
         if (err) return next(err);
         response.locals.user = user;
         next();
     });
};


var findBySomething = function (thing, value, callback) {
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query("SELECT * FROM users WHERE " + thing + " = $1", [value], function (err, result) {
            if (err) return callback(err);

            if (result.rows.length != 1) {
                callback(null, undefined);
                return;
            }
            // we have a valid user - extract data and pass on.
            var user = {};
            user.userID = result.rows[0].userid;
            user.username = result.rows[0].username;
            user.passwordHash = result.rows[0].passwordhash;
            callback(null, user);
        })
    });
};