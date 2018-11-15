// @flow

import type { ThunkAction } from 'redux-thunk';

import type { Job } from 'jobs/reducer';

type JobData = { plan: string, steps: Array<string> };

type FetchJobStarted = {
  type: 'FETCH_JOB_STARTED',
  payload: string,
};
type FetchJobSucceeded = {
  type: 'FETCH_JOB_SUCCEEDED',
  payload: { id: string, job: Job },
};
type FetchJobFailed = {
  type: 'FETCH_JOB_FAILED',
  payload: string,
};
type JobRequested = { type: 'JOB_REQUESTED', payload: JobData };
type JobStarted = {
  type: 'JOB_STARTED',
  payload: Job,
};
type JobRejected = { type: 'JOB_REJECTED', payload: JobData };
export type JobStepCompleted = { type: 'JOB_STEP_COMPLETED', payload: Job };
export type JobsAction =
  | FetchJobStarted
  | FetchJobSucceeded
  | FetchJobFailed
  | JobRequested
  | JobStarted
  | JobRejected
  | JobStepCompleted;

export const fetchJob = (jobId: string): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_JOB_STARTED', payload: jobId });
  return apiFetch(window.api_urls.job_detail(jobId))
    .then(response =>
      dispatch({
        type: 'FETCH_JOB_SUCCEEDED',
        payload: { id: jobId, job: response },
      }),
    )
    .catch(err => {
      dispatch({ type: 'FETCH_JOB_FAILED', payload: jobId });
      throw err;
    });
};

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

export const completeJobStep = (payload: Job): JobStepCompleted => ({
  type: 'JOB_STEP_COMPLETED',
  payload,
});
