var users = require('./users'),
    bcrypt = require('bcrypt');

var auth = module.exports;

auth.checkCredentials = function (request, response, next) {
    console.log('Attempting login');
    var credentials = request.body;
    var session = request.session;
    if (credentials.password && credentials.username) {
        console.log('Login attempt for user: ' + credentials.username);
        // retrieve user from db
        var user = users.findByUsername(credentials.username);
        if (bcrypt.compareSync(credentials.password, user.passwordHash)) {
            session.userID = user.userID;
            console.log('Login successful for user: ' + credentials.username);
            response.json({status: 'Success'})
        } else {
            console.log('Login failed for user: ' + credentials.username);
            delete session.userID;
            response.json({error: 'Valid userID and password required.'});
        }
    } else {
        response.json({error: 'Valid userID and password required.'});
    }
};

auth.logout = function (request, response, next) {
    console.log('Logout requested for ' + request.session.userID);
    delete request.session.userID;
    response.json({status: "Logged out"});
};

auth.requireValidUser = function (request, response, next) {

};