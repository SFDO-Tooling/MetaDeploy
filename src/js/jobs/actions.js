// @flow

import type { ThunkAction } from 'redux-thunk';

import type { Job } from 'jobs/reducer';

type JobData = { plan: string, steps: Array<string> };

type JobRequested = { type: 'JOB_REQUESTED', payload: JobData };
type JobStarted = {
  type: 'JOB_STARTED',
  payload: Job,
};
type JobRejected = { type: 'JOB_REJECTED', payload: JobData };
export type JobsAction = JobRequested | JobStarted | JobRejected;

export const startJob = (data: JobData): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'JOB_REQUESTED', payload: data });
  const url = window.api_urls.job_list();
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => dispatch({ type: 'JOB_STARTED', payload: response }))
    .catch(err => {
      dispatch({ type: 'JOB_REJECTED', payload: data });
      throw err;
    });
};
