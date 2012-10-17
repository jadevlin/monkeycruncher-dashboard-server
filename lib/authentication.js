var users = require('./users'),
    bcrypt = require('bcrypt');

var auth = module.exports;

// This function checks whether the request body contains valid user credentials.
// If credentials are present, the username and password are checked against the
// database. On success, a new session is created, with the user's ID and a flag
// indicating that they are authenticated. A JSON message is returned with a
// successful status field. On failure, any existing session is destroyed and a
// failure JSON message returned.
auth.checkCredentials = function (request, response, next) {
    var credentials = request.body;
    var session = request.session;
    if (credentials.password && credentials.username) {
        console.log('Login attempt for user: ' + credentials.username);
        // retrieve user from db
        var user = users.findByUsername(credentials.username);
        if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
            session.userID = user.userID;
            session.authenticated = true;
            console.log('Login successful for user: ' + credentials.username);
            response.json({status: 'Success'})
        } else {
            console.log('Login failed for user: ' + credentials.username);
            request.session.destroy();
            response.json({error: 'Valid userID and password required.'});
        }
    } else {
        console.log('Malformed login attempt.');
        request.session.destroy();
        response.json({error: 'Valid userID and password required.'});
    }
};

// This function logs the user out, destroying their session.
auth.logout = function (request, response, next) {
    console.log('Logout requested for ' + request.session.userID);
    request.session.destroy();
    response.json({status: "Logged out"});
};

// Middleware to require a valid user. If the current session belongs to an authenticated
// user then the request is passed to the next middleware in the stack. If the session does
// not correspond to an authenticated user then an error message (JSON) is returned.
auth.requireValidUser = function (request, response, next) {
    if (request.session.authenticated) next();
    else response.json({error: 'Authenticated user required.'});

};