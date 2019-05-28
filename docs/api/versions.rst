========
Versions
========

A ``Version`` is a specific iteration of a ``Product``.

List
----

.. sourcecode:: http

   GET /api/versions/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "count": 150,
     "next": "https://.../api/versions/?page=2",
     "previous": null,
     "results": [
       {
         "id": "XG4pVvD",
         "product": "ZPweolo",
         "label": "0.2.0",
         "description": "This is a description of the product version.",
         "created_at": "2019-04-02T20:07:33.117295Z",
         "primary_plan": {
           "id": "g45z7wA",
           "title": "Full Install",
           "version": "XG4pVvD",
           "preflight_message": "<p>Preflight message.</p>",
           "tier": "primary",
           "slug": "full-install",
           "old_slugs": [],
           "steps": [],
           "is_allowed": true,
           "is_listed": true,
           "not_allowed_instructions": null,
           "requires_preflight": true
         },
         "secondary_plan": null,
         "is_listed": true
       },
      ...
     ]
   }

Retrieve
--------

.. sourcecode:: http

   GET /api/versions/XG4pVvD/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "XG4pVvD",
     "product": "ZPweolo",
     "label": "0.2.0",
     "description": "This is a description of the product version.",
     "created_at": "2019-04-02T20:07:33.117295Z",
     "primary_plan": {
       "id": "g45z7wA",
       "title": "Full Install",
       "version": "XG4pVvD",
       "preflight_message": "<p>Preflight message.</p>",
       "tier": "primary",
       "slug": "full-install",
       "old_slugs": [],
       "steps": [],
       "is_allowed": true,
       "is_listed": true,
       "not_allowed_instructions": null,
       "requires_preflight": true
     },
     "secondary_plan": null,
     "is_listed": true
   }

Create
------

.. sourcecode:: http

   POST /api/versions/ HTTP/1.1

   {
     "product": "ZPweolo",
     "label": "0.2.0",
     "description": "This is a description of the product version.",
     "primary_plan": "g45z7wA",
     "secondary_plan": null,
     "is_listed": true
   }

.. sourcecode:: http

   HTTP/1.1 201 CREATED

Update
------

.. sourcecode:: http

   PATCH /api/versions/XG4pVvD/ HTTP/1.1

   {
     "description": "This is a new description of the product version.",
   }

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "XG4pVvD",
     "product": "ZPweolo",
     "label": "0.2.0",
     "description": "This is a new description of the product version.",
     "created_at": "2019-04-02T20:07:33.117295Z",
     "primary_plan": {
       "id": "g45z7wA",
       "title": "Full Install",
       "version": "XG4pVvD",
       "preflight_message": "<p>Preflight message.</p>",
       "tier": "primary",
       "slug": "full-install",
       "old_slugs": [],
       "steps": [],
       "is_allowed": true,
       "is_listed": true,
       "not_allowed_instructions": null,
       "requires_preflight": true
     },
     "secondary_plan": null,
     "is_listed": true
   }

Destroy
-------

.. sourcecode:: http

   DELETE /api/versions/XG4pVvD/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 204 NO CONTENT
