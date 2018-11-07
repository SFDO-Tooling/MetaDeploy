// @flow

import type { JobsAction } from 'jobs/actions';

export type Job = {
  +id: number,
  +creator: {
    +username: string,
    +is_staff: boolean,
  },
  +plan: number,
  +steps: Array<number>,
  +completed_steps: Array<number>,
};
export type JobsState = {
  [string]: Job,
};

const reducer = (jobs: JobsState = {}, action: JobsAction): JobsState => {
  // @@@ should jobs be cleared on logout?
  if (action.type === 'JOB_STARTED') {
    const job = action.payload;
    return { ...jobs, [job.id]: job };
  }
  return jobs;
};

export default reducer;
