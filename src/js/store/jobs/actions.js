// @flow

import type { ThunkAction } from 'redux-thunk';

import apiFetch, { addUrlParams } from 'utils/api';
import type { Job } from 'store/jobs/reducer';
import type { StepResult } from 'store/plans/reducer';

export type JobData = {
  plan: string,
  steps: Array<string>,
  results: {|
    [string]: StepResult,
  |},
};

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
export type JobStepCompleted = {
  type: 'JOB_STEP_COMPLETED',
  payload: Job,
};
export type JobCompleted = { type: 'JOB_COMPLETED', payload: Job };
export type JobFailed = { type: 'JOB_FAILED', payload: Job };
type JobUpdateRequested = { type: 'JOB_UPDATE_REQUESTED', payload: Job };
export type JobUpdated = { type: 'JOB_UPDATED', payload: Job };
type JobUpdateRejected = { type: 'JOB_UPDATE_REJECTED', payload: Job };
type JobCancelRequested = {
  type: 'JOB_CANCEL_REQUESTED',
  payload: string,
};
type JobCancelAccepted = { type: 'JOB_CANCEL_ACCEPTED', payload: string };
type JobCancelRejected = {
  type: 'JOB_CANCEL_REJECTED',
  payload: string,
};
export type JobCanceled = { type: 'JOB_CANCELED', payload: Job };
export type JobsAction =
  | FetchJobStarted
  | FetchJobSucceeded
  | FetchJobFailed
  | JobRequested
  | JobStarted
  | JobRejected
  | JobStepCompleted
  | JobCompleted
  | JobFailed
  | JobUpdateRequested
  | JobUpdated
  | JobUpdateRejected
  | JobCancelRequested
  | JobCancelAccepted
  | JobCancelRejected
  | JobCanceled;

export const fetchJob = ({
  jobId,
  productSlug,
  versionLabel,
  planSlug,
}: {
  jobId: string,
  productSlug: string,
  versionLabel: string,
  planSlug: string,
}): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_JOB_STARTED', payload: jobId });
  const url = window.api_urls.job_detail(jobId);
  const params = {
    plan__plan_template__planslug__slug: planSlug,
    plan__version__label: versionLabel,
    plan__version__product__productslug__slug: productSlug,
  };
  return apiFetch(addUrlParams(url, params), dispatch)
    .then(response => {
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'job',
          id: response.id,
        });
      }
      return dispatch({
        type: 'FETCH_JOB_SUCCEEDED',
        payload: { id: jobId, job: response },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_JOB_FAILED', payload: jobId });
      throw err;
    });
};

export const startJob = (data: JobData): ThunkAction => dispatch => {
  dispatch({ type: 'JOB_REQUESTED', payload: data });
  const url = window.api_urls.job_list();
  return apiFetch(url, dispatch, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response) {
        throw new Error('Invalid response received');
      }
      /* istanbul ignore else */
      if (window.socket) {
        window.socket.subscribe({
          model: 'job',
          id: response.id,
        });
      }
      return dispatch({ type: 'JOB_STARTED', payload: response });
    })
    .catch(err => {
      dispatch({ type: 'JOB_REJECTED', payload: data });
      throw err;
    });
};

export const completeJobStep = (payload: Job): JobStepCompleted => ({
  type: 'JOB_STEP_COMPLETED',
  payload,
});

export const completeJob = (payload: Job): JobCompleted => ({
  type: 'JOB_COMPLETED',
  payload,
});

export const failJob = (payload: Job): JobFailed => ({
  type: 'JOB_FAILED',
  payload,
});

export const updateJob = (payload: {
  +id: string,
  [string]: mixed,
}): ThunkAction => dispatch => {
  const { id } = payload;
  dispatch({ type: 'JOB_UPDATE_REQUESTED', payload });
  const url = window.api_urls.job_detail(id);
  return apiFetch(url, dispatch, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => dispatch({ type: 'JOB_UPDATED', payload: response }))
    .catch(err => {
      dispatch({ type: 'JOB_UPDATE_REJECTED', payload });
      throw err;
    });
};

export const requestCancelJob = (id: string): ThunkAction => dispatch => {
  dispatch({ type: 'JOB_CANCEL_REQUESTED', payload: id });
  const url = window.api_urls.job_detail(id);
  return apiFetch(url, dispatch, {
    method: 'DELETE',
  })
    .then(() => dispatch({ type: 'JOB_CANCEL_ACCEPTED', payload: id }))
    .catch(err => {
      dispatch({ type: 'JOB_CANCEL_REJECTED', payload: id });
      throw err;
    });
};

export const cancelJob = (payload: Job): JobCanceled => ({
  type: 'JOB_CANCELED',
  payload,
});
