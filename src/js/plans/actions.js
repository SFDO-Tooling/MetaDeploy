// @flow

import type { ThunkAction } from 'redux-thunk';

type PreflightRequested = { type: 'PREFLIGHT_REQUESTED', payload: number };
type PreflightStarted = {
  type: 'PREFLIGHT_STARTED',
  payload: number,
};
type PreflightRejected = { type: 'PREFLIGHT_REJECTED', payload: number };
export type PlansAction =
  | PreflightRequested
  | PreflightStarted
  | PreflightRejected;

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
