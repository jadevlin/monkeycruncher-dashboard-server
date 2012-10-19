var users = require('./users'),
    bcrypt = require('bcrypt');

var auth = module.exports;

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. The browser response redirects to the
// dashboard page. On failure, the browser is redirected to the login page.
auth.checkCredentials = function (failurePage, successPage) {
    return function (request, response, next) {
        var failureMessage = 'Valid username and password required.';
        var credentials = request.body;
        var session = request.session;
        // first of all, does request make sense?
        if (credentials.password && credentials.username) {
            console.log('Login attempt for user: ' + credentials.username);
            // retrieve user from db
            var user = users.findByUsername(credentials.username, function (err, user) {
                // take care of db errors
                if (err) {
                    console.error('Database error:\n' + err);
                    session.message = "Database error.";
                    response.redirect(failurePage);
                    return;
                }
                // did we get a user back from the db?
                if (user) {
                    // does the password match?
                    if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
                        // All good, user is authenticated.
                        session.userID = user.userID;
                        session.authenticated = true;
                        console.log('Login successful for user: ' + credentials.username);
                        response.redirect(successPage);
                    } else {
                        // password failure
                        console.log('Login failed for user: ' + credentials.username + ' - password failure.');
                        session.authenticated = false;
                        session.message = failureMessage;
                        response.redirect(failurePage);
                    }
                } else {
                    // no user from the db
                    console.log('Login failed for user: ' + credentials.username + ' - no user found in db.');
                    session.authenticated = false;
                    session.message = failureMessage;
                    response.redirect(failurePage);
                }
            });
        } else {
            console.log('Malformed login attempt.');
            session.authenticated = false;
            session.message = failureMessage;
            response.redirect(failurePage);
        }
    }
};

// This function logs the user out, destroying their session. It redirects the user to the
// given page after logout.
auth.logout = function (redirectPage) {
    return function (request, response, next) {
        console.log('Logout requested for ' + request.session.userID);
        request.session.destroy();
        response.redirect(redirectPage);
    }
};

// handler to register users
auth.register = function(failurePage, successPage) {
    return function (request, response, next) {
        var body = request.body;
        if (body.username && body.password && body.email) {
            users.create(body.username, body.password, body.email, function (err) {
                if (err) {
                    console.log("Database error creating user.");
                    console.log(err);
                    request.session.message = 'There was a problem creating the user. Most likely' +
                        ' the username already exists' +
                        ' or the database is dead.';
                    response.redirect(failurePage);
                    return;
                }
                response.redirect(successPage);
            });
        } else {
            console.log("Malformed user registration request.");
            request.session.message = 'Registration request invalid.';
            response.end("Malformed request.");
        }
    }
};

// Middleware to require a valid user. If the current session belongs to an authenticated
// user then the request is passed to the next middleware in the stack. If the session does
// not correspond to an authenticated user then an error message (JSON) is returned.
auth.requireValidUser = function (request, response, next) {
    if (request.session.authenticated) next();
    else response.redirect('/login.html');
};

auth.hashPassword = function (password) {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

