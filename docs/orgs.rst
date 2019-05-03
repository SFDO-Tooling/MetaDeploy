====
Orgs
====

This is a degenerate endpoint that just shows some details of the
current user's current org.

Retrieve
--------

.. sourcecode:: http
   
   GET /api/orgs/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "current_job": null,
     "current_preflight": null
   }
