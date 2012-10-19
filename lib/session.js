//    redis = require('redis'),
//    RedisStore = require('connect-redis')(express),
//var redisURL = process.env.REDISTOGO_URL || "redis://blank:@localhost:6379/";
//var rdURL = url.parse(redisURL);
//var redisClient = redis.createClient(rdURL.port, rdURL.hostname);
////redis.debug_mode = true;
//redisClient.auth(rdURL.auth.split(":")[1]);
//var redisStore = new RedisStore({client: redisClient, prefix: "websess:"});

// this middleware takes any message found in the session, and pops it out into the response.locals.
// This is convenient for passing failure messages etc on redirect.
// Based on the code in the Express examples.
exports.messagePassing = function () {
    return function (request, response, next) {
        var message = request.session.message;
        delete request.session.message;
        response.locals.message = '';
        if (message) response.locals.message = message;
        next();
    }
};
