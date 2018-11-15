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
|};
export type JobsState = {
  [string]: Job,
};

const reducer = (
  jobs: JobsState = {},
  action: JobsAction | LogoutAction,
): JobsState => {
  if (action.type === 'USER_LOGGED_OUT') {
    return {};
  }
  if (action.type === 'FETCH_JOB_SUCCEEDED') {
    const { id, job } = action.payload;
    return { ...jobs, [id]: job };
  }
  if (action.type === 'JOB_STARTED' || action.type === 'JOB_STEP_COMPLETED') {
    const job = action.payload;
    return { ...jobs, [job.id]: job };
  }
  return jobs;
};

export default reducer;
