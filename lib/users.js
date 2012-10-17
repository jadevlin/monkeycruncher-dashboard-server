var db = require('./database');

// Loads a user from the db by username. Loads asynchronously, so takes a callback to execute when done.
// The first callback parameter is the error, if any, the second is the user. If the user was not found,
// even though the query executed successfully (i.e. they're not in the db), returns undefined for the user
// without error.
exports.findByUsername = function (username, callback) {
    db.connect(function (err, client) {
        if (err) {
            callback(err);
            return;
        }
        client.query("SELECT * FROM users WHERE username = $1", [username], function (err, result) {
            if (err) {
                callback(err);
                return;
            }

            if (result.rows.length != 1) {
                callback(null, undefined);
                return;
            }

            // we have a valid user - extract data and pass on.
            var user = {};
            user.userID = result.rows[0].userID;
            user.username = result.rows[0].username;
            user.passwordHash = result.rows[0].passwordHash;
            callback(null, user);
        })
    });
};