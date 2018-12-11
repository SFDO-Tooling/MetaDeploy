// @flow

import type { JobsAction } from 'jobs/actions';
import type { LogoutAction } from 'accounts/actions';
import type { StepResult } from 'plans/reducer';

export type Job = {|
  +id: string,
  +model_type: 'job',
  +edited_at: string,
  +job_id: string,
  +creator: {
    +username: string,
    +is_staff: boolean,
  } | null,
  +plan: string,
  +status: 'started' | 'complete' | 'failed',
  +steps: Array<string>,
  +results: {|
    [string]: Array<StepResult>,
  |},
  +org_name: string | null,
  +org_type: string | null,
  +organization_url: string | null,
  +error_count: number,
  +warning_count: number,
  +is_public: boolean,
  +user_can_edit: boolean,
  +message: string,
|};
export type JobsState = {
  [string]: Job,
};

const reducer = (
  jobs: JobsState = {},
  action: JobsAction | LogoutAction,
): JobsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_JOB_SUCCEEDED': {
      const { id, job } = action.payload;
      return { ...jobs, [id]: job };
    }
    case 'JOB_STARTED':
    case 'JOB_COMPLETED':
    case 'JOB_UPDATED':
    case 'JOB_STEP_COMPLETED': {
      const job = action.payload;
      const existingJob = jobs[job.id];
      if (!existingJob || job.edited_at > existingJob.edited_at) {
        return { ...jobs, [job.id]: job };
      }
      return jobs;
    }
  }
  return jobs;
};

export default reducer;
