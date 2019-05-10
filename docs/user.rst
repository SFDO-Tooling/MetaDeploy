====
User
====

This is a degenerate endpoint that just shows some details of the
current user.

Retrieve
--------

.. sourcecode:: http
   
   GET /api/user/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "3Lw7OwK",
     "username": "kit@oddbird.net",
     "email": "kit@oddbird.net",
     "valid_token_for": "https://foo.salesforce.com",
     "org_name": "Oddbird",
     "org_type": "Developer Edition",
     "is_staff": true
   }
