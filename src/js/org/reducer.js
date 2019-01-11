// @flow

import type { LogoutAction } from 'user/actions';
import type { OrgAction } from 'org/actions';

export type Org = {
  +current_job: string | null,
  +current_preflight: string | null,
} | null;

const reducer = (org: Org = null, action: OrgAction | LogoutAction): Org => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return null;
    case 'FETCH_ORG_JOBS_SUCCEEDED':
    case 'ORG_CHANGED':
      return action.payload;
  }
  return org;
};

export default reducer;
