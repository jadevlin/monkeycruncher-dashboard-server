/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var db = require('monkeycruncher-shared-code').database("postgres://localhost:5432/monkeycruncher"),
    auth = require('./authentication'),
    logging = require('monkeycruncher-shared-code').logging;


// Loads a user from the db by username. The first callback parameter is the error, if any, the second is the user.
// If the user was not found, even though the query executed successfully (i.e. they're not in the db), returns
// undefined for the user without error.
exports.findByUsername = function (username, callback) {
    findBySomething('username', username, callback);
};

// same as above, except loads from the ID
exports.findByUserID = function (id, callback) {
    findBySomething('id', id, callback);
};

var findBySomething = function (thing, value, callback) {
    var action = logging.action("dashboard.find_user", {key: thing, value: value});
    db.connectAndQuery("SELECT * FROM users WHERE " + thing + " = $1", [value], function (err, result) {
        if (err) return logging.handleErrorWithAction(err, action, callback);
        if (result.rows.length != 1) {
            action.error("more_than_one_user_found");
            callback(null, undefined);
            return;
        }
        // we have a valid user - extract data and pass on.
        var user = {};
        var res = result.rows[0];
        user.id = res.id;
        user.username = res.username;
        user.passwordHash = res.password_hash;
        user.active = res.active;
        user.admin = res.admin;
        user.email = res.email;
        action.finish();
        callback(null, user);
    });
};

exports.create = function (username, password, email, callback) {
    var action = logging.action("dashboard.create_user", {username: username});
    db.connectAndQuery(
        "SELECT * FROM users WHERE username = $1",
        [username],
        function (err, result) {
            if (err) return logging.handleErrorWithAction(err, action, callback);
            if (result.rows.length != 0) {
                action.warn("username_in_use");
                return callback(new Error("User name already in use."));
            }
            // all good, so add the user
            var passwordHash = auth.hashPassword(password);
            db.connectAndQuery(
                "INSERT INTO users (username, password_hash, email, active, admin) VALUES( $1, $2, $3, true, false )",
                [username, passwordHash, email],
                function (err) {
                    if (err) return logging.handleErrorWithAction(err, action, callback);
                    // and get the new user's ID so we can identify them
                    db.connectAndQuery(
                        "SELECT * FROM users WHERE username = $1",
                        [username],
                        function (err, results) {
                            if (err) return logging.handleErrorWithAction(err, action, callback);
                            if (result.rows.length != 0) {
                                action.error("new_user_load_failed");
                                return callback(new Error("Failed to load new user"));
                            }
                            action.finish();
                            callback(undefined, {userID: results.rows[0].id});
                        })
                })
        });
};

