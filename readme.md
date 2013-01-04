MonkeyCruncher dashboard server
===============================

The dashboard is the user's personal view of the MonkeyCruncher cloud. Initially, it will be used to list the user's
worksheets, and allow them to create, delete, copy, edit and share them. The dashboard is a single-page client-side app,
and this server provides the data to it. It also communicates with the edit server to manage worksheet editing
privileges in a secure manner. For details of the worksheet creation, editing and forking processes, see the edit server
documentation.


Running
=======

The dashboard server runs in node and is started with 'node dashboard-server.js'. You will need to have a redis instance
running for the session and authorization stores. You will also need to have a postgresql instance running for the
dashboard database. An empty dashboard database can be created with the db/create_database.sql script.

If you're running locally you'll need to set up a mapping from a hostname that isn't localhost in your hosts file. If
you don't do this, the dashboard-server cookies will get in to an argument with the edit-server cookies. If you add the
following to /etc/hosts then everything should just work:

127.0.0.1  dashboard.localhost<br/>
127.0.0.1  edit-server.localhost

You should make sure that when you test the system that you access the dashboard through the dashboard.localhost URL:

http://dashboard.localhost:5000/login.html


Client-facing API
=================

POST /authenticate
Description: Takes a username and password in the request body. Checks the credentials against the DB and if successful
             marks the user session as authenticated, storing the user ID in the session TODO: store user to save on db
             queries. This function returns an anti-CSRF token in its response which must be used by the client in all
             subsequent communications (as a query paramter _csrf).
Security:    Open to all.

POST /logout
Description: Destroys the user session.
Security:    Open to all.

GET /config
Description: Gets a configuration object that is used to set up the client side app.
Security:    Open to all.

GET /userinfo
Description: Gets a the user's information.
Security:    Requires authenticated user, and anti-CSRF token.

GET /worksheets
Description: Gets a list of the users worksheets.
Security:    Requires authenticated user, and anti-CSRF token.

POST /worksheets/create/:name
Description: Creates a new worksheet with the given name. Returns the new worksheet object in the response.
Security:    Requires authenticated user, and anti-CSRF token.

POST /worksheets/delete/:id
Description: Deletes the worksheet with the given id. Also, messages edit-server to delete the actual document from the
             store. Note that this id (and all other ids, to be contrasted with uuids) are the dashboard database ID and
             not the edit-server UUID.
Security:    Requires authenticated user, and anti-CSRF token.

POST /worksheets/rename/:id
Description: Renames the worksheet with the given id.
Security:    Requires authenticated user, and anti-CSRF token.

POST /worksheets/authorizeEdit/:id
Description: Authorizes an edit of the worksheet with the given ID. See the edit-server readme for full details. Returns
             the authorization token that the client will need in the response.
Security:    Requires authenticated user, and anti-CSRF token.

POST /worksheets/claim/:uuid
Description: Claims the worksheet with the given UUID. Returns the worksheet object in the response.
Security:    Requires authenticated user, and anti-CSRF token.


Private API (for edit-server)
=============================

Note that detailed descriptions of the application flows for the creation, saving, editing and forking processes can be
found in the edit server documentation.

POST /registerfork/:newUUID/:oldUUID
Description: After the edit-server creates a new forked document it calls this endpoint to register it with the
             dashboard-server database.
Security:    Admin app.


Other
=====

For convenience, things that might not belong here, but are here anyway:

POST /register
Description: Requires a username, password, and email in the request body. Adds the user to the database.
             TODO: email confirmation, admin notification (hipchat?)
Security:    Open to all.


Licence
=======

The MonkeyCruncher edit-server code is licenced to you under the MIT licence. See the file LICENCE.txt for full details.
