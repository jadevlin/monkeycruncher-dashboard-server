var express = require('express'),
    users = require('./lib/users'),
    auth = require('./lib/authentication');

// configuration variables
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";

// configure the server
var app = express();
// the view engine
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
// default middleware
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: sessionSecret}));
app.use(app.router);
app.use(express.static(__dirname + '/static'));
app.enable("trust proxy");

// authentication
app.post('/authenticate', auth.checkCredentials);
app.get('/logout', auth.logout);

// define views
app.get('/login.html', function (request, response) {
    response.render('login');
});

app.get('/dashboard.html', auth.requireValidUser, users.loadUser, function (request, response) {
   response.render('dashboard',
       {
           user: response.locals.user
       });
});


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
