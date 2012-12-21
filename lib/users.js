var db = require('./database'),
    auth = require('./authentication');

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
    db.connect(function (err, client) {
        if (err) return callback(err);
        client.query("SELECT * FROM users WHERE " + thing + " = $1", [value], function (err, result) {
            if (err) return callback(err);

            if (result.rows.length != 1) {
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
            callback(null, user);
        })
    });
};

exports.create = function (username, password, email, callback) {
    console.log("Creating user - " + username);
    db.connect(function (err, client) {
        if (err) return callback(err);
        var passwordHash = auth.hashPassword(password);
        client.query(
            "INSERT INTO users (username, password_hash, email, active, admin) VALUES( $1, $2, $3, true, false )",
            [username, passwordHash, email],
            callback);
    });
};