/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var auth = require('./authentication'),
    uuid = require('node-uuid'),
    logging = require('monkeycruncher-shared-code').logging;


// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. It returns a JSON response indicating
// status.
exports.checkCredentials = function (request, response, next) {
    var credentials = request.body;
    var session = request.session;
    var action = logging.action("dashboard.check_credentials_mw", {user: credentials.username});
    auth.checkCredentials(credentials, function (err, user) {
        if (err) {
            session.authenticated = false;
            action.warn("credential_check_failed");
            // Not sure this is a by-the-book use of 401.
            response.status(401);
            response.json({status: 'Authentication failed.'});
        } else {
            session.userID = user.id;
            session.authenticated = true;
            // generate a secret token and store it in the session.
            var csrf = uuid.v4();
            session._csrf = csrf;
            action.finish({userID: user.id});
            // The CSRF token from the session is returned and must be stored by the client.
            response.json({status: 'ok', _csrf: csrf, userID: user.id});
        }
    });
};

// This function logs the user out, destroying their session.
exports.logout = function (request, response, next) {
    logging.event('dashboard.logout', {userID: request.session.userID});
    request.session.destroy();
    response.json({status: 'ok'});
};


// Middleware to require an authenticated session. If the current session is authenticated
// then the request is passed to the next middleware in the stack. Otherwise a response is
// sent with a 401 error.
// TODO: not sure this is the right way to signal the failure.
exports.requireAuthenticated = function (request, response, next) {
    // Authenticated methods use a cookie to key the session. To prevent CSRF attacks, there is also a token
    // stored within the session that must be passed as a query parameter (_csrf) to all authenticated calls. This
    // token must be acquired by the client on login, and stored. The middleware checks the validity of that token.
    var action = logging.action('dashboard.require_authenticated', {userID: request.session.userID});
    if (request.session.authenticated && (request.session._csrf === request.query._csrf)) {
        action.finish();
        next();
    }
    else {
        // Not sure this is a by-the-book use of 401.
        action.warn("not_authenticated");
        response.status(401);
        response.json({status: "You must be authenticated."});
    }
};