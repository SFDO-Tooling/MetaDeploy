import { ThunkResult } from '@/store';
import { Org } from '@/store/org/reducer';
import apiFetch from '@/utils/api';

type FetchOrgJobsStarted = {
  type: 'FETCH_ORG_JOBS_STARTED';
};
export type FetchOrgJobsSucceeded = {
  type: 'FETCH_ORG_JOBS_SUCCEEDED';
  payload: Org;
};
type FetchOrgJobsFailed = {
  type: 'FETCH_ORG_JOBS_FAILED';
};
export type OrgChanged = {
  type: 'ORG_CHANGED';
  payload: Org;
};
export type OrgAction =
  | FetchOrgJobsStarted
  | FetchOrgJobsSucceeded
  | FetchOrgJobsFailed
  | OrgChanged;

export const fetchOrgJobs = (): ThunkResult<
  Promise<FetchOrgJobsSucceeded>
> => async (dispatch) => {
  dispatch({ type: 'FETCH_ORG_JOBS_STARTED' as const });
  try {
    const response = await apiFetch(window.api_urls.org_list(), dispatch);
    return dispatch({
      type: 'FETCH_ORG_JOBS_SUCCEEDED' as const,
      payload: response,
    });
  } catch (err) {
    dispatch({ type: 'FETCH_ORG_JOBS_FAILED' as const });
    throw err;
  }
};

export const updateOrg = (payload: Org): OrgChanged => ({
  type: 'ORG_CHANGED' as const,
  payload,
});
