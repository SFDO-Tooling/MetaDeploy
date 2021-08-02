import { ThunkResult } from '@/js/store';
import { addError } from '@/js/store/errors/actions';
import { PreflightStarted } from '@/js/store/plans/actions';
import { Preflight } from '@/js/store/plans/reducer';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';
import apiFetch from '@/js/utils/api';

type FetchScratchOrgStarted = {
  type: 'FETCH_SCRATCH_ORG_STARTED';
  payload: string;
};
type FetchScratchOrgSucceeded = {
  type: 'FETCH_SCRATCH_ORG_SUCCEEDED';
  payload: { plan: string; org: ScratchOrg | null };
};
type FetchScratchOrgFailed = {
  type: 'FETCH_SCRATCH_ORG_FAILED';
  payload: string;
};

type ScratchOrgSpinRequested = {
  type: 'SCRATCH_ORG_SPIN_REQUESTED';
  payload: {
    plan: string;
    email: string;
  };
};
export type ScratchOrgSpinning = {
  type: 'SCRATCH_ORG_SPINNING';
  payload: ScratchOrg;
};
export type ScratchOrgUpdated = {
  type: 'SCRATCH_ORG_UPDATED';
  payload: ScratchOrg;
};
export type ScratchOrgFailed = {
  type: 'SCRATCH_ORG_FAILED';
  payload: string;
};
export type ScratchOrgError = {
  type: 'SCRATCH_ORG_ERROR';
  payload: string;
};

export type ScratchOrgsAction =
  | FetchScratchOrgStarted
  | FetchScratchOrgSucceeded
  | FetchScratchOrgFailed
  | ScratchOrgSpinRequested
  | ScratchOrgSpinning
  | ScratchOrgUpdated
  | ScratchOrgFailed
  | ScratchOrgError;

export const fetchScratchOrg =
  (planId: string): ThunkResult<Promise<FetchScratchOrgSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'FETCH_SCRATCH_ORG_STARTED' as const, payload: planId });
    try {
      const response = await apiFetch(
        window.api_urls.plan_scratch_org(planId),
        dispatch,
      );
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'scratchorg',
          id: response.id,
        });
      }
      return dispatch({
        type: 'FETCH_SCRATCH_ORG_SUCCEEDED' as const,
        payload: { plan: planId, org: response },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_SCRATCH_ORG_FAILED' as const, payload: planId });
      throw err;
    }
  };

export const spinScratchOrg =
  (planId: string, email: string): ThunkResult<Promise<ScratchOrgSpinning>> =>
  async (dispatch) => {
    dispatch({
      type: 'SCRATCH_ORG_SPIN_REQUESTED' as const,
      payload: { plan: planId, email },
    });
    const url = window.api_urls.plan_scratch_org(planId);
    try {
      const response = await apiFetch(url, dispatch, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      /* istanbul ignore else */
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'scratchorg',
          id: response.id,
          uuid: response.uuid,
        });
      }
      return dispatch({
        type: 'SCRATCH_ORG_SPINNING' as const,
        payload: response,
      });
    } catch (error) {
      dispatch({
        type: 'SCRATCH_ORG_ERROR' as const,
        payload: planId,
      });
      throw error;
    }
  };

export const updateScratchOrg = (payload: ScratchOrg): ScratchOrgUpdated => ({
  type: 'SCRATCH_ORG_UPDATED' as const,
  payload,
});

export const createScratchOrg = (payload: ScratchOrg): ScratchOrgUpdated => {
  if (window.socket && payload.org_id) {
    window.socket.subscribe({
      model: 'org',
      id: payload.org_id,
    });
  }
  return {
    type: 'SCRATCH_ORG_UPDATED' as const,
    payload,
  };
};

export const failScratchOrg =
  ({
    message,
    plan,
  }: {
    message?: string;
    org: string;
    plan: string;
  }): ThunkResult<ScratchOrgFailed> =>
  (dispatch) => {
    if (message) {
      dispatch(addError(message));
    }
    return dispatch({
      type: 'SCRATCH_ORG_FAILED' as const,
      payload: plan,
    });
  };

export const createPreflight = (payload: Preflight): PreflightStarted => {
  if (payload && window.socket) {
    window.socket.subscribe({
      model: 'preflightresult',
      id: payload.id,
    });
  }
  return {
    type: 'PREFLIGHT_STARTED' as const,
    payload,
  };
};
