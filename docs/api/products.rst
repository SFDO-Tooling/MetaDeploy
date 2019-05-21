========
Products
========

A ``Product`` is a set of ``Versions`` of metadata for your Salesforce
org.

List
----

.. sourcecode:: http

   GET /api/products/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   [
     {
       "id": "ZPweolo",
       "title": "Product With Useful Data",
       "description": "<p>Description for Product</p>",
       "short_description": "",
       "click_through_agreement": "<p>Lorem ipsum dolor sit amet</p>",
       "category": "salesforce.org products",
       "color": "",
       "icon": null,
       "image": null,
       "most_recent_version": {
         "id": "m9vAdwZ",
         "product": "ZPweolo",
         "label": "0.3.1",
         "description": "This is a description of the product version.",
         "created_at": "2019-04-02T20:07:33.205093Z",
         "primary_plan": {
           "id": "owEgDlm",
           "title": "Full Install",
           "version": "m9vAdwZ",
           "preflight_message": "<p>Preflight message</p>",
           "tier": "primary",
           "slug": "full-install",
           "old_slugs": [],
           "steps": [
             {
               "id": "Lw7K5wK",
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
           "requires_preflight": true
         },
         "secondary_plan": {
           "id": "olNjglg",
           "title": "Reports and Dashboards",
           "version": "m9vAdwZ",
           "preflight_message": "<p>Preflight message</p>",
           "tier": "secondary",
           "slug": "reports-and-dashboards",
           "old_slugs": [],
           "steps": [
             {
               "id": "ologald",
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
           "requires_preflight": true
         },
         "additional_plans": [
           {
             "id": "plYx3vX",
             "title": "Account Record Types",
             "version": "m9vAdwZ",
             "preflight_message": "<p>Preflight message</p>",
             "tier": "additional",
             "slug": "account-record-types",
             "old_slugs": [],
             "steps": [
               {
                 "id": "Av8AMlD",
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
             "requires_preflight": true
           },
           ...
         ],
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

Retrieve
--------

.. sourcecode:: http
   
   GET /api/products/ZPweolo/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "ZPweolo",
     "title": "Product With Useful Data",
     "description": "<p>Description for Product</p>",
     "short_description": "",
     "click_through_agreement": "<p>Lorem ipsum dolor sit amet</p>",
     "category": "salesforce.org products",
     "color": "",
     "icon": null,
     "image": null,
     "most_recent_version": {
       "id": "m9vAdwZ",
       "product": "ZPweolo",
       "label": "0.3.1",
       "description": "This is a description of the product version.",
       "created_at": "2019-04-02T20:07:33.205093Z",
       "primary_plan": {
         "id": "owEgDlm",
         "title": "Full Install",
         "version": "m9vAdwZ",
         "preflight_message": "<p>Preflight message</p>",
         "tier": "primary",
         "slug": "full-install",
         "old_slugs": [],
         "steps": [
           {
             "id": "Lw7K5wK",
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
         "requires_preflight": true
       },
       "secondary_plan": {
         "id": "olNjglg",
         "title": "Reports and Dashboards",
         "version": "m9vAdwZ",
         "preflight_message": "<p>Preflight message</p>",
         "tier": "secondary",
         "slug": "reports-and-dashboards",
         "old_slugs": [],
         "steps": [
           {
             "id": "ologald",
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
         "requires_preflight": true
       },
       "additional_plans": [
         {
           "id": "plYx3vX",
           "title": "Account Record Types",
           "version": "m9vAdwZ",
           "preflight_message": "<p>Preflight message</p>",
           "tier": "additional",
           "slug": "account-record-types",
           "old_slugs": [],
           "steps": [
             {
               "id": "Av8AMlD",
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
           "requires_preflight": true
         },
         ...
       ],
       "is_listed": true
     },
     "slug": "product-with-useful-data",
     "old_slugs": [],
     "is_allowed": true,
     "is_listed": true,
     "order_key": 0,
     "not_allowed_instructions": null
   }

Create
------

.. sourcecode:: http
   
   POST /api/products/ HTTP/1.1

   {
     "title": "Product With Useful Data",
     "description": "Description for Product with _markdown_",
     "short_description": "",
     "click_through_agreement": "Lorem ipsum dolor sit amet with *markdown*",
     "category": "salesforce.org products",
     "color": "",
     "icon": null,
     "image": null,
     "is_allowed": true,
     "is_listed": true,
     "order_key": 0,
     "not_allowed_instructions": null
   }

.. sourcecode:: http

   HTTP/1.1 201 CREATED

Update
------

.. sourcecode:: http
   
   PATCH /api/products/ZPweolo/ HTTP/1.1

   {
     "description": "This is a new *description* of the product version.",
   }

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "ZPweolo",
     "title": "Product With Useful Data",
     "description": "<p>This is a new <strong>description</strong> of the product version.</p>",
     "short_description": "",
     "click_through_agreement": "<p>Lorem ipsum dolor sit amet</p>",
     "category": "salesforce.org products",
     "color": "",
     "icon": null,
     "image": null,
     "most_recent_version": {
       "id": "m9vAdwZ",
       "product": "ZPweolo",
       "label": "0.3.1",
       "description": "This is a description of the product version.",
       "created_at": "2019-04-02T20:07:33.205093Z",
       "primary_plan": {
         "id": "owEgDlm",
         "title": "Full Install",
         "version": "m9vAdwZ",
         "preflight_message": "<p>Preflight message</p>",
         "tier": "primary",
         "slug": "full-install",
         "old_slugs": [],
         "steps": [
           {
             "id": "Lw7K5wK",
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
         "requires_preflight": true
       },
       "secondary_plan": {
         "id": "olNjglg",
         "title": "Reports and Dashboards",
         "version": "m9vAdwZ",
         "preflight_message": "<p>Preflight message</p>",
         "tier": "secondary",
         "slug": "reports-and-dashboards",
         "old_slugs": [],
         "steps": [
           {
             "id": "ologald",
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
         "requires_preflight": true
       },
       "additional_plans": [
         {
           "id": "plYx3vX",
           "title": "Account Record Types",
           "version": "m9vAdwZ",
           "preflight_message": "<p>Preflight message</p>",
           "tier": "additional",
           "slug": "account-record-types",
           "old_slugs": [],
           "steps": [
             {
               "id": "Av8AMlD",
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
           "requires_preflight": true
         },
         ...
       ],
       "is_listed": true
     },
     "slug": "product-with-useful-data",
     "old_slugs": [],
     "is_allowed": true,
     "is_listed": true,
     "order_key": 0,
     "not_allowed_instructions": null
   }

Destroy
-------

.. sourcecode:: http
   
   DELETE /api/products/ZPweolo/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 204 NO CONTENT
