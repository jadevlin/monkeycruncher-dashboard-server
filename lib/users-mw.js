/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var users = require('./users'),
    logging = require('monkeycruncher-shared-code').logging;


// user loading middleware, requires the userID in the session (i.e. that the user is logged in).
// loads the user in to the request locals object
exports.loadUser = function (request, response, next) {
    var action = logging.action("dasboard.load_user_mw", {userID: request.session.userID});
    users.findByUserID(request.session.userID, function (err, user) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        action.finish();
        response.locals.user = user;
        next();
    });
};

// handler to register users
exports.register = function (request, response, next) {
    var body = request.body;
    var action = logging.action('dashboard.register_mw');
    if (body.username && body.password && body.email) {
        if (body.username.length < 3) {
            action.warn("username_too_short");
            return response.json({status: 'error', message: "Username too short"});
        }
        if (body.password.length < 5) {
            action.warn("password_too_short");
            return response.json({status: 'error', message: "Password too short"});
        }
        users.create(body.username, body.password, body.email, function (err) {
            if (err) {
                action.error("unable_to_create_user");
                return response.json({status: 'error', message: err.message});
            }
            action.finish();
            response.json({status: 'ok'});
        });
    } else {
        action.warn("malformed_request");
        return response.json({status: 'error', message: "Malformed user registration request"});
    }
};
