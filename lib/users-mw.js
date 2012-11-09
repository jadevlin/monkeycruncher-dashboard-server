var users = require('./users');

// user loading middleware, requires the userID in the session (i.e. that the user is logged in).
// loads the user in to the request locals object
exports.loadUser = function (request, response, next) {
    console.log("Loading user " + request.session.userID);
    users.findByUserID(request.session.userID, function (err, user) {
        if (err) return next(err);
        response.locals.user = user;
        next();
    });
};

// handler to register users
exports.register = function (request, response, next) {
    var body = request.body;
    if (body.username && body.password && body.email) {
        users.create(body.username, body.password, body.email, next);
    } else {
        next(new Error("Malformed user registration request."))
    }
};
