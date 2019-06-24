==========
Categories
==========

A ``Category`` is an organizing principle associated with ``Products``.

List
----

.. sourcecode:: http

   GET /api/categories/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   [
      {
         "id": 31,
         "title": "salesforce.org products",
         "first_page": {
            "count": 5,
            "next": null,
            "previous": null,
            "results": [
               {
                  "id": "PlzA6vB",
                  "title": "Product With Useful Data",
                  "description": "<p>Description for Product</p>",
                  "short_description": "",
                  "click_through_agreement": "<p>Lorem ipsum dolor sit amet</p>",
                  "category": "salesforce.org products",
                  "color": "",
                  "icon": null,
                  "image": null,
                  "most_recent_version": {
                     "id": "9vAWL4Z",
                     "product": "PlzA6vB",
                     "label": "0.3.1",
                     "description": "This is a description of the product version.",
                     "created_at": "2019-05-28T16:34:12.462520Z",
                     "primary_plan": {
                        "id": "O4GLdwR",
                        "title": "Full Install",
                        "version": "9vAWL4Z",
                        "preflight_message": "<p>Preflight message</p>",
                        "tier": "primary",
                        "slug": "full-install",
                        "old_slugs": [],
                        "steps": [
                           {
                              "id": "PweKylo",
                              "name": "Quick step",
                              "description": "This is a description of the step.",
                              "is_required": true,
                              "is_recommended": false,
                              "kind": "Metadata",
                              "kind_icon": "package"
                           },
                           ...
                        ],
                        "is_allowed": true,
                        "is_listed": true,
                        "not_allowed_instructions": null,
                        "average_duration": null,
                        "requires_preflight": true
                     },
                     "secondary_plan": {
                        "id": "9wO6n4Z",
                        "title": "Reports and Dashboards",
                        "version": "9vAWL4Z",
                        "preflight_message": "<p>Preflight message</p>",
                        "tier": "secondary",
                        "slug": "reports-and-dashboards",
                        "old_slugs": [],
                        "steps": [
                           {
                              "id": "WlmdqvJ",
                              "name": "Quick step",
                              "description": "This is a description of the step.",
                              "is_required": true,
                              "is_recommended": false,
                              "kind": "Metadata",
                              "kind_icon": "package"
                           },
                           ...
                        ],
                        "is_allowed": true,
                        "is_listed": true,
                        "not_allowed_instructions": null,
                        "average_duration": null,
                        "requires_preflight": false
                     },
                     "is_listed": true
                  },
                  "slug": "product-with-useful-data",
                  "old_slugs": [],
                  "is_allowed": true,
                  "is_listed": true,
                  "order_key": 0,
                  "not_allowed_instructions": null
               },
               ...
            ]
         }
      },
      ...
   ]

Retrieve
--------

.. sourcecode:: http

   GET /api/products/31/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
      "id": 31,
      "title": "salesforce.org products",
      "first_page": {
         "count": 5,
         "next": null,
         "previous": null,
         "results": [
            {
               "id": "PlzA6vB",
               "title": "Product With Useful Data",
               "description": "<p>Description for Product</p>",
               "short_description": "",
               "click_through_agreement": "<p>Lorem ipsum dolor sit amet</p>",
               "category": "salesforce.org products",
               "color": "",
               "icon": null,
               "image": null,
               "most_recent_version": {
                  "id": "9vAWL4Z",
                  "product": "PlzA6vB",
                  "label": "0.3.1",
                  "description": "This is a description of the product version.",
                  "created_at": "2019-05-28T16:34:12.462520Z",
                  "primary_plan": {
                     "id": "O4GLdwR",
                     "title": "Full Install",
                     "version": "9vAWL4Z",
                     "preflight_message": "<p>Preflight message</p>",
                     "tier": "primary",
                     "slug": "full-install",
                     "old_slugs": [],
                     "steps": [
                        {
                           "id": "PweKylo",
                           "name": "Quick step",
                           "description": "This is a description of the step.",
                           "is_required": true,
                           "is_recommended": false,
                           "kind": "Metadata",
                           "kind_icon": "package"
                        },
                        ...
                     ],
                     "is_allowed": true,
                     "is_listed": true,
                     "not_allowed_instructions": null,
                     "average_duration": null,
                     "requires_preflight": true
                  },
                  "secondary_plan": {
                     "id": "9wO6n4Z",
                     "title": "Reports and Dashboards",
                     "version": "9vAWL4Z",
                     "preflight_message": "<p>Preflight message</p>",
                     "tier": "secondary",
                     "slug": "reports-and-dashboards",
                     "old_slugs": [],
                     "steps": [
                        {
                           "id": "WlmdqvJ",
                           "name": "Quick step",
                           "description": "This is a description of the step.",
                           "is_required": true,
                           "is_recommended": false,
                           "kind": "Metadata",
                           "kind_icon": "package"
                        },
                        ...
                     ],
                     "is_allowed": true,
                     "is_listed": true,
                     "not_allowed_instructions": null,
                     "average_duration": null,
                     "requires_preflight": false
                  },
                  "is_listed": true
               },
               "slug": "product-with-useful-data",
               "old_slugs": [],
               "is_allowed": true,
               "is_listed": true,
               "order_key": 0,
               "not_allowed_instructions": null
            },
            ...
         ]
      }
   }
