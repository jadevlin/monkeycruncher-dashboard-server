//    redis = require('redis'),
//    RedisStore = require('connect-redis')(express),
//var redisURL = process.env.REDISTOGO_URL || "redis://blank:@localhost:6379/";
//var rdURL = url.parse(redisURL);
//var redisClient = redis.createClient(rdURL.port, rdURL.hostname);
////redis.debug_mode = true;
//redisClient.auth(rdURL.auth.split(":")[1]);
//var redisStore = new RedisStore({client: redisClient, prefix: "websess:"});
