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
dashboard database.

If you're running locally you'll need to set up a mapping from a hostname that isn't localhost in your hosts file. If
you don't do this, the dashboard-server cookies will get in to an argument with the edit-server cookies. If you add the
following to /etc/hosts then everything should just work:

127.0.0.1  dashboard.localhost<br/>
127.0.0.1  edit-server.localhost

You should make sure that when you test the system that you access the dashboard through the dashboard.localhost URL:

http://dashboard.localhost:5000/login.html


Client-facing API
=================




Private API (for edit-server)
=============================

Note that detailed descriptions of the application flows for the creation, saving, editing and forking processes can be
found in the edit server documentation.

POST /fork/:newUUID

Pages
=====



Licence
=======

The MonkeyCruncher edit-server code is licenced to you under the MIT licence. See the file LICENCE.txt for full details.
