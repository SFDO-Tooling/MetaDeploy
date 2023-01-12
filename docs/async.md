# Asynchronous Jobs

MetaDeploy has a variety of different things that one might think of
as "Jobs".

 * [Scheduled Jobs](scheduled_jobs.md)
 * Plan-running jobs, which is what "Jobs" means in the [API](api/jobs.rst)
 * Processes spun off by APIs to do things asynchronously on behalf of users, rather than blocking REST API responses.

 This document is about the Asynchronous processes related to specific
 user sessions. In the code base these are marked with the decorator
 `@job` or `job()`

 ## Async Jobs triggered by end-users

 * [run_flows_job](https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy+%22def+run_flows%22&type=code) : Runs a plan against a CumulusCI Org

 * [enqueuer_job](https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy%20enqueuer&type=code) : Enqueues a run_flows_job. This indirection is caused by an implementation detail. Note that it also invalidates pre-flight checks.

 * [preflight_job](https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy+%22def+preflight%28preflight_result_id%29%3A%22&type=code) : Runs preflight checks against an org

 * [create_scratch_org](https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy+%22def+create_scratch_org&type=code) : Create a scratch org. Under some circumstances it will also run plan steps. See the code for the details.

* [delete_scratch_org](https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy+%22def+delete_scratch_org&type=code) : Delete a Scratch org

## Async Jobs triggered by Admins

 * [update_all_translations]((https://github.com/search?q=repo%3ASFDO-Tooling%2FMetaDeploy+%22def+update_all_translations&type=code)) : Update every TranslatableModel object for every language from every relevant Translation object

## Scheduled Jobs
Below is a description of the various automated jobs that MetaDeploy has and how they can be configured.


### `cleanup_user_data`

Frequency: every minute

This job does four key things:

1. Sets the status of any jobs which were started but are past their timeout to "canceled" and updates the `canceled_at` and `exception` fields on the corresponding `Job` record.
2. Delete any OAuth tokens older than 10 minutes if the user doesn't have any running jobs currently. This can be configured with the TOKEN_LIFETIME_MINUTES environment variable.
3. Deletes all non-staff users that have not logged in for the last thirty days.
4. Clears the exception field in `Job` and `Preflight` records over 90 days old. (This field may contain customer metadata such as custom schema names from the org).
5. Deletes any API tokens that are older than 30 days. The number of days can be configured with the `API_TOKEN_EXPIRE_AFTER_DAYS` environment variable.

### `expire_preflight_results`

Frequency: every minute

Invalidates any preflight checks that were created more than 10 minutes ago. This can be configured to a custom value by setting the PREFLIGHT_LIFETIME_MINUTES environment variable.

### `calculate_average_plan_runtimes`

Frequency: daily

Calculates the average plan runtime for all plans, and then stores the value. Pages that need to reference plan runtime reference the calculated value for quicker page loads.