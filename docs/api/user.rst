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
     "username": "foo@example.com",
     "email": "foo@example.com",
     "valid_token_for": "00Dxxxxxxxxxxxxxxx",
     "org_name": "OddBird",
     "org_type": "Developer Edition",
     "is_staff": true
   }
