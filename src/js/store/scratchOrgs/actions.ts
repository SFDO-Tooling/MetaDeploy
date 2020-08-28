import { ThunkResult } from '@/store';
import { Plan } from '@/store/plans/reducer';
import { ScratchOrg } from '@/store/scratchOrgs/reducer';
import apiFetch from '@/utils/api';

export type ScratchOrgSpinning = {
  type: 'SCRATCH_ORG_SPINNING';
  payload: string;
};

export type ScratchOrgCreated = {
  type: 'SCRATCH_ORG_CREATED';
  payload: ScratchOrg;
};

export type ScratchOrgError = {
  type: 'SCRATCH_ORG_ERROR';
  payload: ScratchOrg;
};

export type ScratchOrgsAction =
  | ScratchOrgSpinning
  | ScratchOrgCreated
  | ScratchOrgError;
export const spinOrg = (
  plan: Plan,
  email: string,
): ThunkResult<Promise<ScratchOrgSpinning>> => async (dispatch) => {
  dispatch({ type: 'SCRATCH_ORG_SPINNING', payload: plan.id });
  const url = window.api_urls.plan_create_scratch_org(plan.id);
  try {
    const response = await apiFetch(url, dispatch, {
      method: 'POST',
      body: JSON.stringify({ email, plan }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    /* istanbul ignore else */
    if (response && window.socket) {
      window.socket.subscribe({
        model: 'scratch_org',
        id: response.job_id,
      });
    }
    return dispatch({
      type: 'SCRATCH_ORG_SPINNING' as const,
      payload: response,
    });
  } catch (error) {
    dispatch({ type: 'SCRATCH_ORG_ERROR' as const, payload: error });
    throw error;
  }
};

export const createScratchOrg = (payload: ScratchOrg): ScratchOrgCreated => ({
  type: 'SCRATCH_ORG_CREATED' as const,
  payload,
});

export const errorScratchOrg = (payload: ScratchOrg): ScratchOrgError => ({
  type: 'SCRATCH_ORG_ERROR' as const,
  payload,
});
