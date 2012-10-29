var users = require('./users'),
    bcrypt = require('bcrypt');

var auth = module.exports;

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. The browser response redirects to the
// dashboard page. On failure, the browser is redirected to the login page.
auth.checkCredentials = function (request, response, next) {
    var failureMessage = 'Valid username and password required.';
    var credentials = request.body;
    var session = request.session;
    // first of all, does request make sense?
    if (credentials.password && credentials.username) {
        console.log('Login attempt for user: ' + credentials.username);
        // retrieve user from db
        var user = users.findByUsername(credentials.username, function (err, user) {
            // take care of db errors
            if (err) return next(err);
            // did we get a user back from the db?
            if (user) {
                // does the password match?
                if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
                    // is user enabled?
                    if (user.active) {
                        // All good, user is authenticated.
                        session.userID = user.id;
                        session.authenticated = true;
                        console.log('Login successful for user: ' + credentials.username);
                        next();
                    } else {
                        // user account not active
                        console.log('Login failed for user: ' + credentials.username + ' - not activated.');
                        session.authenticated = false;
                        next(new Error("This account is not activated."));
                    }

                } else {
                    // password failure
                    console.log('Login failed for user: ' + credentials.username + ' - password failure.');
                    session.authenticated = false;
                    next(new Error(failureMessage));
                }
            } else {
                // no user from the db
                console.log('Login failed for user: ' + credentials.username + ' - no user found in db.');
                session.authenticated = false;
                next(new Error(failureMessage));
            }
        });
    } else {
        console.log('Malformed login attempt.');
        session.authenticated = false;
        next(new Error(failureMessage));
    }
};

// This function logs the user out, destroying their session. It redirects the user to the
// given page after logout.
auth.logout = function (request, response, next) {
    console.log('Logout requested for ' + request.session.userID);
    request.session.destroy();
    next();
};


// Middleware to require an authenticated session. If the current session is authenticated
// then the request is passed to the next middleware in the stack.
auth.requireAuthenticated = function (redirectURL) {
    return function (request, response, next) {
        if (request.session.authenticated) next();
        else response.redirect(redirectURL);
    }
};

auth.hashPassword = function (password) {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

