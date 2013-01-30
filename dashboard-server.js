/*
 * This file is part of MonkeyCruncher. Copyright (C) 2012-2013, Jony Hudson.
 *
 * MonkeyCruncher is licenced to you under the MIT licence. See the file
 * LICENCE.txt for full details.
 */

var express = require('express'),
    users = require('./lib/users'),
    usersMW = require('./lib/users-mw'),
    worksheetsMW = require('./lib/worksheets-mw'),
    authMW = require('./lib/authentication-mw'),
    sessionStore = require('monkeycruncher-shared-code').sessionStore,
    editServer = require('./lib/edit-server-api'),
    campfire = require('monkeycruncher-shared-code').campfire;

// configuration variables
var port = process.env.PORT || 5000;
var sessionSecret = process.env.SESSION_SECRET || "a very secret string";
var secureOnly = process.env.SECURE_ONLY || false;

// configure the server
var app = express();
app.enable("trust proxy");
// in production we only allow secure connections, controlled by the SECURE_ONLY environment variable.
if (secureOnly) app.use(function (request, response, next) {
    if (request.secure) next();
    else response.end("Please use the secure (https) site!");
});
// default middleware
app.use(express.favicon());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ store: sessionStore.createStore(express, "dash:", 3600), secret: sessionSecret }));
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
        editServerURL: editServer.url
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
    worksheetsMW.create
);
app.post('/worksheets/delete/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.delete
);
app.post('/worksheets/rename/:id/:newName',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.rename
);
app.post('/worksheets/authorizeEdit/:id',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.mustBeWorksheetOwner,
    worksheetsMW.loadWorksheet,
    worksheetsMW.authorizeEdit
);
app.post('/worksheets/claim/:uuid',
    authMW.requireAuthenticated,
    usersMW.loadUser,
    worksheetsMW.claim
);

// ** Private API **

app.post('/registerFork/:newUUID/:oldUUID',
    editServer.requireEditServer,
    worksheetsMW.registerFork
);

// ** Public API for website **
app.get('/website/worksheets/recent',
    worksheetsMW.recentlyEditedWorksheets
);

app.get('/website/worksheets/get/:id',
    worksheetsMW.getWorksheet
);

// ** Other stuff **
// registration form - not sure this really belongs in the dashboard server, but it'll do for now.
// requires parameters username, password and email in request body.
// TODO: at the moment this just takes a simple form and redirects. Could be a bit smoother.
app.post('/register',
    usersMW.register,
    function (request, response) {
        campfire.postMessage('New user registration: ' + request.body.username + '<' + request.body.email + '>');
        response.redirect('/registration_success.html');
    }
);


// start the server
app.listen(port, function () {
    console.log("Listening on " + port)
    campfire.postMessage('MonkeyCruncher dashboard server started: ' + process.env.PORT);
});
