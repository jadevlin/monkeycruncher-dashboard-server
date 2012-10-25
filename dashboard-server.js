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
app.enable("trust proxy");
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
app.use(express.errorHandler());


// ** Actions **
// redirect helper function
var redirect = function (url) { return function (request, response) { response.redirect(url); }};
// authentication
// requires parameters username and password in request body
app.post('/authenticate',
    auth.checkCredentials,
    redirect('/dashboard.html')
);
app.get('/logout',
    auth.logout,
    redirect('/login.html')
);
// registration
// requires parameters username, password and email in request body
app.post('/register',
    users.register,
    redirect('/registration_success.html')
);
// worksheets
// requires parameter name in request body
app.post('/create',
    auth.requireAuthenticated('/login.html'),
    users.loadUser,
    worksheets.create(editServerURL),
    redirect('/dashboard.html')
);
// requires parameter worksheetID in request body
app.post('/delete',
    auth.requireAuthenticated('/login.html'),
    users.loadUser,
    worksheets.mustBeWorksheetOwner,
    worksheets.delete(editServerURL)
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
    auth.requireAuthenticated('/login.html'),
    users.loadUser,
    worksheets.loadAllWorksheets,
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
