var express = require('express'),
    users = require('./lib/users'),
    usersMW = require('./lib/users-mw'),
    worksheetsMW = require('./lib/worksheets-mw'),
    authMW = require('./lib/authentication-mw'),
    sessionStore = require('./lib/session-store');

// configuration variables
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";
var editServerURL = process.env.EDIT_SERVER_URL || "http://edit-server.localhost:5050/";
var sharedSecret = process.env.SHARED_SECRET || "a secret for inter-app communication";

// configure the server
var app = express();
app.enable("trust proxy");
// default middleware
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ store: sessionStore.createStore(express), secret: sessionSecret }));
app.use(app.router);
app.use(express.static(__dirname + '/static'));
app.use(express.errorHandler());

// ** Client-facing API **

// authentication
// requires parameters username and password in request body
app.post('/authenticate',
    authMW.checkCredentials
);
app.post('/logout',
    authMW.logout
);
// client configuration
app.get('/config', function (request, response) {
    response.json({
        editServerURL: editServerURL
    });
});
//user
app.get('/userinfo',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    function (request, response) {
        var user = response.locals.user;
        delete user.passwordHash;
        response.json(user);
    }
);
// worksheets
app.get('/worksheets',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.loadAllWorksheets,
    function (request, response) {
        response.json(response.locals.worksheets);
    }
);
app.post('/worksheets/create/:name',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.create(editServerURL, sharedSecret)
);
app.post('/worksheets/remove/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.remove(editServerURL, sharedSecret)
);
app.post('/worksheets/authorizeEdit/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.authorizeEdit(editServerURL, sharedSecret)
);
app.post('/worksheets/claim/:uuid',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.claim
);

// ** Private API **

app.post('/registerFork/:newUUID/:oldUUID',
    authMW.requireAdminApp(sharedSecret),
    worksheetsMW.registerFork
);

// ** Other stuff **
// registration form - not sure this really belongs in the dashboard server, but it'll do for now.
// requires parameters username, password and email in request body.
// TODO: at the moment this just takes a simple form and redirects. Could be a bit smoother.
app.post('/register',
    usersMW.register,
    function (request, response) {
        response.redirect('/registration_success.html');
    }
);


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
});
