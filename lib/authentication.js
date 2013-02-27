/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var users = require('./users'),
    bcrypt = require('bcrypt'),
    logging = require('monkeycruncher-shared-code').logging;


var auth = module.exports;

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. The browser response redirects to the
// dashboard page. On failure, the browser is redirected to the login page.
auth.checkCredentials = function (credentials, callback) {
    var failureMessage = 'Valid username and password required.';
    var action = logging.action("dashboard.check_credentials", {userName: credentials.username});
    // first of all, does request make sense?
    if (credentials.password && credentials.username) {
        // retrieve user from db
        var user = users.findByUsername(credentials.username, function (err, user) {
            // take care of db errors
            if (err) return logging.handleErrorWithAction(err, action, callback, "db_error");
            // did we get a user back from the db?
            if (user) {
                // does the password match?
                if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
                    // is user enabled?
                    if (user.active) {
                        // All good, user is authenticated.
                        action.finish();
                        callback(null, user);
                    } else {
                        // user account not active
                        action.warn("not_activated");
                        callback(new Error("This account is not activated."));
                    }

                } else {
                    // password failure
                    action.warn("password failure");
                    callback(new Error(failureMessage));
                }
            } else {
                // no user from the db
                action.warn("no_user");
                callback(new Error(failureMessage));
            }
        });
    } else {
        action.warn("malformed_login");
        callback(new Error(failureMessage));
    }
};

auth.hashPassword = function (password) {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

