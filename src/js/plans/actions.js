// @flow

import type { ThunkAction } from 'redux-thunk';

import type { Preflight } from 'plans/reducer';

type FetchPreflightStarted = {
  type: 'FETCH_PREFLIGHT_STARTED',
  payload: number,
};
type FetchPreflightSucceeded = {
  type: 'FETCH_PREFLIGHT_SUCCEEDED',
  payload: { plan: number, preflight: Preflight },
};
type FetchPreflightFailed = {
  type: 'FETCH_PREFLIGHT_FAILED',
  payload: number,
};
type PreflightRequested = { type: 'PREFLIGHT_REQUESTED', payload: number };
type PreflightStarted = {
  type: 'PREFLIGHT_STARTED',
  payload: number,
};
type PreflightRejected = { type: 'PREFLIGHT_REJECTED', payload: number };
export type PreflightCompleted = {
  type: 'PREFLIGHT_COMPLETED',
  payload: Preflight,
};
export type PlansAction =
  | FetchPreflightStarted
  | FetchPreflightSucceeded
  | FetchPreflightFailed
  | PreflightRequested
  | PreflightStarted
  | PreflightRejected
  | PreflightCompleted;

export const fetchPreflight = (planId: number): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PREFLIGHT_STARTED', payload: planId });
  return apiFetch(window.api_urls.plan_preflight(planId))
    .then(response =>
      dispatch({
        type: 'FETCH_PREFLIGHT_SUCCEEDED',
        payload: { plan: planId, preflight: response },
      }),
    )
    .catch(err => {
      dispatch({ type: 'FETCH_PREFLIGHT_FAILED', payload: planId });
      throw err;
    });
};

export const startPreflight = (planId: number): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'PREFLIGHT_REQUESTED', payload: planId });
  const url = window.api_urls.plan_preflight(planId);
  return apiFetch(url, { method: 'POST' })
    .then(() => dispatch({ type: 'PREFLIGHT_STARTED', payload: planId }))
    .catch(err => {
      dispatch({ type: 'PREFLIGHT_REJECTED', payload: planId });
      throw err;
    });
};

export const completePreflight = (payload: Preflight): PreflightCompleted => ({
  type: 'PREFLIGHT_COMPLETED',
  payload,
});
