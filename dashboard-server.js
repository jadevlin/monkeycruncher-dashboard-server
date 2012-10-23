var express = require('express'),
    users = require('./lib/users'),
    worksheets = require('./lib/worksheets'),
    auth = require('./lib/authentication'),
    session = require('./lib/session');

// configuration variables
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";
var editServerURL = process.env.EDIT_SERVER_URL || "https://localhost:5050/";

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
app.use(session.messagePassing());
app.use(app.router);
app.use(express.static(__dirname + '/static'));
app.enable("trust proxy");

// ** Actions **
// authentication
app.post('/authenticate', auth.checkCredentials('/login.html', '/dashboard.html'));
app.get('/logout', auth.logout('/login.html'));
// registration
app.post('/register', auth.register('/register.html', '/registration_success.html'));
// worksheets
app.post('/create',
    auth.requireAuthenticated,
    users.loadUser,
    worksheets.create(editServerURL)
);

// ** Views **
// These pages are defined as views to take advantage of the templating to keep the page style
// consistent and allow passing messages to the user on error
var addTrivialView = function (path, viewName) {
    app.get(path, function (request, response) {
        response.render(viewName, {message: response.locals.message});
    });
};
addTrivialView('/login.html', 'login');
addTrivialView('/register.html', 'register');
addTrivialView('/registration_success.html', 'registration_success');

// The main dashboard view - the heart of the app
app.get('/dashboard.html',
    auth.requireAuthenticated,
    users.loadUser,
    worksheets.loadWorksheets,
    function (request, response) {
        response.render('dashboard',
            {
                user: response.locals.user,
                worksheets: response.locals.worksheets
            });
    });


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
