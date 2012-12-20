var auth = require('./authentication');

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. The browser response redirects to the
// dashboard page. On failure, the browser is redirected to the login page.
exports.checkCredentials = function (request, response, next) {
    var credentials = request.body;
    var session = request.session;
    auth.checkCredentials(credentials, function (err, user) {
        if (err) {
            session.authenticated = false;
            // Not sure this is a by-the-book use of 401.
            response.status(401);
            response.json({status: 'Authentication failed.'});
        } else {
            session.userID = user.id;
            session.authenticated = true;
            console.log('Login successful for user: ' + credentials.username);
            response.json({status: 'ok'});
        }
    });
};

// This function logs the user out, destroying their session. It redirects the user to the
// given page after logout.
exports.logout = function (request, response, next) {
    console.log('Logout requested for ' + request.session.userID);
    request.session.destroy();
    response.json({status: 'ok'});
};


// Middleware to require an authenticated session. If the current session is authenticated
// then the request is passed to the next middleware in the stack.
exports.requireAuthenticated = function (request, response, next) {
    if (request.session.authenticated) next();
    else {
        // Not sure this is a by-the-book use of 401.
        response.status(401);
        response.json({status: "You must be authenticated."});
    }
};

exports.requireAdminApp = function (secret) {
    return function (request, response, next) {
        if (request.body.secret !== secret) response.json({status: "You are not an authorized admin app."});
        else next();
    }
};