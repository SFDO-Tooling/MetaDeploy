// @flow

import type { ThunkAction } from 'redux-thunk';

import apiFetch from 'utils/api';
import type { Org } from 'store/org/reducer';

type FetchOrgJobsStarted = {
  type: 'FETCH_ORG_JOBS_STARTED',
};
type FetchOrgJobsSucceeded = {
  type: 'FETCH_ORG_JOBS_SUCCEEDED',
  payload: Org,
};
type FetchOrgJobsFailed = {
  type: 'FETCH_ORG_JOBS_FAILED',
};
export type OrgChanged = {
  type: 'ORG_CHANGED',
  payload: Org,
};
export type OrgAction =
  | FetchOrgJobsStarted
  | FetchOrgJobsSucceeded
  | FetchOrgJobsFailed
  | OrgChanged;

export const fetchOrgJobs = (): ThunkAction => (dispatch) => {
  dispatch({ type: 'FETCH_ORG_JOBS_STARTED' });
  return apiFetch(window.api_urls.org_list(), dispatch)
    .then((response) =>
      dispatch({
        type: 'FETCH_ORG_JOBS_SUCCEEDED',
        payload: response,
      }),
    )
    .catch((err) => {
      dispatch({ type: 'FETCH_ORG_JOBS_FAILED' });
      throw err;
    });
};

export const updateOrg = (payload: Org): OrgChanged => ({
  type: 'ORG_CHANGED',
  payload,
});
