/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

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
        if (body.username.length < 3) return next(new Error("Username too short"));
        if (body.password.length < 5) return next(new Error("Password too short"));
        users.create(body.username, body.password, body.email, next);
    } else {
        next(new Error("Malformed user registration request."))
    }
};
