var users = require('./users'),
    bcrypt = require('bcrypt');

var auth = module.exports;

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. The browser response redirects to the
// dashboard page. On failure, the browser is redirected to the login page.
auth.checkCredentials = function (credentials, callback) {
    var failureMessage = 'Valid username and password required.';
    // first of all, does request make sense?
    if (credentials.password && credentials.username) {
        console.log('Login attempt for user: ' + credentials.username);
        // retrieve user from db
        var user = users.findByUsername(credentials.username, function (err, user) {
            // take care of db errors
            if (err) return callback(err);
            // did we get a user back from the db?
            if (user) {
                // does the password match?
                if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
                    // is user enabled?
                    if (user.active) {
                        // All good, user is authenticated.
                        console.log('Login successful for user: ' + credentials.username);
                        callback(null, user);
                    } else {
                        // user account not active
                        console.log('Login failed for user: ' + credentials.username + ' - not activated.');
                        callback(new Error("This account is not activated."));
                    }

                } else {
                    // password failure
                    console.log('Login failed for user: ' + credentials.username + ' - password failure.');
                    callback(new Error(failureMessage));
                }
            } else {
                // no user from the db
                console.log('Login failed for user: ' + credentials.username + ' - no user found in db.');
                callback(new Error(failureMessage));
            }
        });
    } else {
        console.log('Malformed login attempt.');
        callback(new Error(failureMessage));
    }
};

auth.hashPassword = function (password) {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

