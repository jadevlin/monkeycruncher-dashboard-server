MonkeyCruncher dashboard server
===============================

The dashboard is the user's personal view of the MonkeyCruncher cloud. Initially, it will be used to list the user's
worksheets, and allow them to create, delete, copy, edit and share them.


Running
=======

If you're running this locally you'll need to set up a mapping from a hostname that isn't localhost in your hosts file.
If you don't do this, the dashboard cookies will get in to an argument with the edit-server cookies. If you add the
following to /etc/hosts then everything should just work:

127.0.0.1  dashboard.localhost
127.0.0.1  edit-server.localhost

You should make sure that when you test the system that you access the dashboard through the dashboard.localhost URL:

http://dashboard.localhost:5000/login.html
