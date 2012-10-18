var pg = require('pg');

var pgURL = process.env.DATABASE_URL || "postgres://localhost:5432/monkeycruncher";

module.exports.connect = function (callback) {
    pg.connect(pgURL, callback);
};
