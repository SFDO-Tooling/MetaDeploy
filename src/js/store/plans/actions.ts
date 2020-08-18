import { ThunkResult } from '@/store';
import { Preflight } from '@/store/plans/reducer';
import apiFetch from '@/utils/api';

type FetchPreflightStarted = {
  type: 'FETCH_PREFLIGHT_STARTED';
  payload: string;
};
type FetchPreflightSucceeded = {
  type: 'FETCH_PREFLIGHT_SUCCEEDED';
  payload: { plan: string; preflight: Preflight };
};
type FetchPreflightFailed = {
  type: 'FETCH_PREFLIGHT_FAILED';
  payload: string;
};
type PreflightRequested = { type: 'PREFLIGHT_REQUESTED'; payload: string };
export type PreflightStarted = {
  type: 'PREFLIGHT_STARTED';
  payload: Preflight;
};
type PreflightRejected = { type: 'PREFLIGHT_REJECTED'; payload: string };
export type PreflightCompleted = {
  type: 'PREFLIGHT_COMPLETED';
  payload: Preflight;
};
export type PreflightFailed = {
  type: 'PREFLIGHT_FAILED';
  payload: Preflight;
};
export type PreflightCanceled = {
  type: 'PREFLIGHT_CANCELED';
  payload: Preflight;
};
export type PreflightInvalid = {
  type: 'PREFLIGHT_INVALIDATED';
  payload: Preflight;
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
  | PreflightCanceled
  | PreflightInvalid;

export const fetchPreflight = (
  planId: string,
): ThunkResult<Promise<FetchPreflightSucceeded>> => (dispatch) => {
  dispatch({ type: 'FETCH_PREFLIGHT_STARTED' as const, payload: planId });
  return apiFetch(window.api_urls.plan_preflight(planId), dispatch)
    .then((response) => {
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'preflightresult',
          id: response.id,
        });
      }
      return dispatch({
        type: 'FETCH_PREFLIGHT_SUCCEEDED' as const,
        payload: { plan: planId, preflight: response },
      });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_PREFLIGHT_FAILED' as const, payload: planId });
      throw err;
    });
};

export const startPreflight = (
  planId: string,
): ThunkResult<Promise<PreflightStarted>> => (dispatch) => {
  dispatch({ type: 'PREFLIGHT_REQUESTED' as const, payload: planId });
  const url = window.api_urls.plan_preflight(planId);
  return apiFetch(url, dispatch, { method: 'POST' })
    .then((response) => {
      /* istanbul ignore else */
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'preflightresult',
          id: response.id,
        });
      }
      return dispatch({
        type: 'PREFLIGHT_STARTED' as const,
        payload: response,
      });
    })
    .catch((err) => {
      dispatch({ type: 'PREFLIGHT_REJECTED' as const, payload: planId });
      throw err;
    });
};

export const completePreflight = (payload: Preflight): PreflightCompleted => ({
  type: 'PREFLIGHT_COMPLETED' as const,
  payload,
});

export const failPreflight = (payload: Preflight): PreflightFailed => ({
  type: 'PREFLIGHT_FAILED' as const,
  payload,
});

export const cancelPreflight = (payload: Preflight): PreflightCanceled => ({
  type: 'PREFLIGHT_CANCELED' as const,
  payload,
});

export const invalidatePreflight = (payload: Preflight): PreflightInvalid => ({
  type: 'PREFLIGHT_INVALIDATED' as const,
  payload,
});
