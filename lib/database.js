/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var pg = require('pg');

var pgURL = process.env.DATABASE_URL || "postgres://localhost:5432/monkeycruncher";

module.exports.connect = function (callback) {
    pg.connect(pgURL, callback);
};
