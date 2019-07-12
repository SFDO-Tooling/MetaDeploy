// @flow

import type { LogoutAction } from 'store/user/actions';
import type { OrgAction } from 'store/org/actions';

export type CurrentJob = {
  +id: string,
  +product_slug: string,
  +version_label: string,
  +plan_slug: string,
  +plan_average_duration: string | null,
};

export type Org = {
  +current_job: CurrentJob | null,
  +current_preflight: string | null,
} | null;

const reducer = (org: Org = null, action: OrgAction | LogoutAction): Org => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return null;
    case 'FETCH_ORG_JOBS_SUCCEEDED':
    case 'ORG_CHANGED':
      return action.payload;
    case 'PREFLIGHT_COMPLETED':
      // workaround for ORG_CHANGED sometimes being missed
      return { ...org, current_preflight: null };
  }
  return org;
};

export default reducer;
