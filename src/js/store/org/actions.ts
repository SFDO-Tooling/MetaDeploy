import { ThunkResult } from '@/js/store';
import { Org, Orgs } from '@/js/store/org/reducer';
import apiFetch from '@/js/utils/api';

type FetchOrgJobsStarted = {
  type: 'FETCH_ORG_JOBS_STARTED';
};
export type FetchOrgJobsSucceeded = {
  type: 'FETCH_ORG_JOBS_SUCCEEDED';
  payload: Orgs;
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

export const fetchOrgJobs =
  (): ThunkResult<Promise<FetchOrgJobsSucceeded>> => async (dispatch) => {
    dispatch({ type: 'FETCH_ORG_JOBS_STARTED' as const });
    try {
      const response: Orgs = await apiFetch(
        window.api_urls.org_list(),
        dispatch,
      );
      if (response && window.socket) {
        for (const orgId of Object.keys(response)) {
          /* istanbul ignore else */
          if (orgId !== 'null') {
            window.socket.subscribe({
              model: 'org',
              id: orgId,
            });
          }
        }
      }
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
