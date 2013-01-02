/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var redis = require('redis'),
    connectRedis = require('connect-redis'),
    url = require('url');

exports.createStore = function (express) {
    var redisURL = process.env.REDISTOGO_URL || "redis://blank:@localhost:6379/";
    var rdURL = url.parse(redisURL);
    var redisClient = redis.createClient(rdURL.port, rdURL.hostname);
    //redis.debug_mode = true;
    redisClient.auth(rdURL.auth.split(":")[1]);

    var RedisStore = connectRedis(express);
    return new RedisStore({client: redisClient, prefix: "dash:", ttl: 3600});
};


