var express = require('express'),
    users = require('./lib/users'),
    auth = require('./lib/authentication');

//get config from the environment
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";

// configure the server
var app = express();
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: sessionSecret}));
app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.enable("trust proxy");

// define the endpoints
// -authentication
app.post('/api/authenticate', auth.checkCredentials);
app.get('/api/logout', auth.logout);
// -user
app.get('/api/protected', auth.requireValidUser, function (request, response) {
   response.json({message: 'You are privileged!'});
});
// -worksheet


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
