MonkeyCruncher dashboard
========================

The dashboard is the user's personal view of the MonkeyCruncher cloud. Initially, it will be used to list the user's
worksheets, and allow them to create, delete, copy, edit and share them.

Security
========



API
===

POST /authenticate
Description: Authenticate the user in and give them a cookie.
Security:    Anyone, needs to post a suitable username and password in the request body
             i.e. {"username": "jony", "password": "pass"}.

POST /logout
Description: Log the user out and destroy their session.
Security:    Logged in user.

POST /worksheet/create/
Description: Create a new worksheet. This adds a worksheet to the user's account, and also calls the edit server to
             create the actual worksheet document.
Security:    Logged in user.

POST /worksheet/authorize/:id
Description: Contacts the edit server to grant authorization to edit this document. Returns the authorization token if
             successful.
Security:    Logged in user. Must own the document.

POST /worksheet/delete/:id
Description: Delete a worksheet from the user's account. This also calls the edit server to delete the actual document.
Security:    Logged in user. Must own the document.

POST /worksheet/clone/:id
Description: Makes a copy of this worksheet associated to the users account. Also calls the edit server to make a copy
             of the actual document.
Security:    Logged in user. Worksheet must be accessible (either owned, or public).

POST /worksheet/share/:id
Description: Publicly shares the worksheet.
Security:    Logged in user. Must own the document.

