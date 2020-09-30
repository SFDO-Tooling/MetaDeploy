import { ThunkResult } from '@/store';
import { addError } from '@/store/errors/actions';
import { ScratchOrg } from '@/store/scratchOrgs/reducer';
import apiFetch from '@/utils/api';

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
export type ScratchOrgCreated = {
  type: 'SCRATCH_ORG_CREATED';
  payload: ScratchOrg;
};
export type ScratchOrgFailed = {
  type: 'SCRATCH_ORG_FAILED';
  payload: ScratchOrg;
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
  | ScratchOrgCreated
  | ScratchOrgFailed
  | ScratchOrgError;

export const fetchScratchOrg = (
  planId: string,
): ThunkResult<Promise<FetchScratchOrgSucceeded>> => async (dispatch) => {
  dispatch({ type: 'FETCH_SCRATCH_ORG_STARTED' as const, payload: planId });
  try {
    const response = await apiFetch(
      window.api_urls.plan_scratch_org(planId),
      dispatch,
    );
    if (response && window.socket) {
      window.socket.subscribe({
        model: 'scratch_org',
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

export const spinScratchOrg = (
  planId: string,
  email: string,
): ThunkResult<Promise<ScratchOrgSpinning>> => async (dispatch) => {
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
        model: 'scratch_org',
        id: response.id,
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

export const createScratchOrg = (payload: ScratchOrg): ScratchOrgCreated => ({
  type: 'SCRATCH_ORG_CREATED' as const,
  payload,
});

export const failScratchOrg = ({
  message,
  org,
}: {
  message: string;
  org: ScratchOrg;
}): ThunkResult<ScratchOrgFailed> => (dispatch) => {
  dispatch(addError(message));
  return dispatch({
    type: 'SCRATCH_ORG_FAILED' as const,
    payload: org,
  });
};
