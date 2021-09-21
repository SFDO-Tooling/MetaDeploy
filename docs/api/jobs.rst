====
Jobs
====

This is a constrained endpoint. You cannot list or meaningfully update.

Retrieve
--------

.. sourcecode:: http

   GET /api/jobs/9wORq4Z/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 200 OK

   {
     "id": "9wORq4Z",
     "creator": {
       "username": "kit@oddbird.net",
       "is_staff": true
     },
     "plan": "owEgDlm",
     "steps": [
       "Lw7K5wK",
       ...
     ],
     "instance_url": "https://na53.salesforce.com",
     "results": {
       "Lw7K5wK": [
         {
           "status": "ok"
         }
       ]
     },
     "created_at": "2019-05-03T18:47:22.422135Z",
     "edited_at": "2019-05-03T18:47:36.956559Z",
     "enqueued_at": "2019-05-03T18:47:31.324809Z",
     "job_id": "ea2441f1-d72d-4521-b6d1-59f701807d37",
     "status": "started",
     "org_name": "OddBird",
     "org_type": "Developer Edition",
     "error_count": 0,
     "warning_count": 0,
     "is_public": false,
     "user_can_edit": true,
     "message": "<p>Success! You installed it.</p>",
     "error_message": "",
     "product_slug": "test-product",
     "version_label": "1.0.0",
     "version_is_most_recent": true,
     "plan_slug": "my-plan"
   }

Create
------

.. sourcecode:: http

   POST /api/jobs/ HTTP/1.1

   {
     "plan": "owEgDlm",
     "steps": [
       "Lw7K5wK",
       ...
     ],
     "is_public": false
   }

.. sourcecode:: http

   HTTP/1.1 201 CREATED

Destroy
-------

.. sourcecode:: http

   DELETE /api/jobs/9wORq4Z/ HTTP/1.1

.. sourcecode:: http

   HTTP/1.1 204 NO CONTENT

(Note, it will take a little time to stop the job; this puts a sentinel
in Redis, that the job runner will check for and bail if it finds.)
