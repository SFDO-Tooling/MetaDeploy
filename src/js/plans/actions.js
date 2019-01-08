// @flow

import type { ThunkAction } from 'redux-thunk';

import type { Preflight } from 'plans/reducer';

type FetchPreflightStarted = {
  type: 'FETCH_PREFLIGHT_STARTED',
  payload: string,
};
type FetchPreflightSucceeded = {
  type: 'FETCH_PREFLIGHT_SUCCEEDED',
  payload: { plan: string, preflight: Preflight },
};
type FetchPreflightFailed = {
  type: 'FETCH_PREFLIGHT_FAILED',
  payload: string,
};
type PreflightRequested = { type: 'PREFLIGHT_REQUESTED', payload: string };
type PreflightStarted = {
  type: 'PREFLIGHT_STARTED',
  payload: Preflight,
};
type PreflightRejected = { type: 'PREFLIGHT_REJECTED', payload: string };
export type PreflightCompleted = {
  type: 'PREFLIGHT_COMPLETED',
  payload: Preflight,
};
export type PreflightFailed = {
  type: 'PREFLIGHT_FAILED',
  payload: Preflight,
};
export type PreflightInvalid = {
  type: 'PREFLIGHT_INVALIDATED',
  payload: Preflight,
};
export type PlansAction =
  | FetchPreflightStarted
  | FetchPreflightSucceeded
  | FetchPreflightFailed
  | PreflightRequested
  | PreflightStarted
  | PreflightRejected
  | PreflightCompleted
  | PreflightFailed
  | PreflightInvalid;

export const fetchPreflight = (planId: string): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PREFLIGHT_STARTED', payload: planId });
  return apiFetch(window.api_urls.plan_preflight(planId))
    .then(response => {
      if (response) {
        window.socket.subscribe({
          model: 'preflightresult',
          id: response.id,
        });
      }
      return dispatch({
        type: 'FETCH_PREFLIGHT_SUCCEEDED',
        payload: { plan: planId, preflight: response },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_PREFLIGHT_FAILED', payload: planId });
      throw err;
    });
};

export const startPreflight = (planId: string): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'PREFLIGHT_REQUESTED', payload: planId });
  const url = window.api_urls.plan_preflight(planId);
  return apiFetch(url, { method: 'POST' })
    .then(response => {
      window.socket.subscribe({
        model: 'preflightresult',
        id: response.id,
      });
      return dispatch({ type: 'PREFLIGHT_STARTED', payload: response });
    })
    .catch(err => {
      dispatch({ type: 'PREFLIGHT_REJECTED', payload: planId });
      throw err;
    });
};

export const completePreflight = (payload: Preflight): PreflightCompleted => ({
  type: 'PREFLIGHT_COMPLETED',
  payload,
});

export const failPreflight = (payload: Preflight): PreflightFailed => ({
  type: 'PREFLIGHT_FAILED',
  payload,
});

export const invalidatePreflight = (payload: Preflight): PreflightInvalid => ({
  type: 'PREFLIGHT_INVALIDATED',
  payload,
});
