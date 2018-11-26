// @flow

import type { JobsAction } from 'jobs/actions';
import type { LogoutAction } from 'accounts/actions';

export type Job = {|
  +id: string,
  +creator: {
    +username: string,
    +is_staff: boolean,
  } | null,
  +plan: string,
  +status: 'started' | 'complete' | 'failed',
  +steps: Array<string>,
  +completed_steps: Array<string>,
  +org_name: string | null,
  +org_type: string | null,
  +organization_url: string | null,
  +error_count: number,
  +warning_count: number,
  +is_public: boolean,
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
    case 'JOB_UPDATED': {
      const job = action.payload;
      return { ...jobs, [job.id]: job };
    }
    case 'JOB_STEP_COMPLETED': {
      const { step_id, job } = action.payload;
      const existingJob = jobs[job.id];
      if (!existingJob) {
        return { ...jobs, [job.id]: job };
      }
      const { steps, completed_steps } = existingJob;
      if (completed_steps.includes(step_id) || !steps.includes(step_id)) {
        return jobs;
      }
      return {
        ...jobs,
        [job.id]: {
          ...existingJob,
          completed_steps: [...completed_steps, step_id],
        },
      };
    }
  }
  return jobs;
};

export default reducer;
