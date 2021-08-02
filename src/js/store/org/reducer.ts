import { OrgAction } from '@/js/store/org/actions';
import { LogoutAction } from '@/js/store/user/actions';

export type CurrentJob = {
  id: string;
  product_slug: string;
  version_label: string;
  plan_slug: string;
  plan_average_duration: string | null;
};

export type Org = {
  org_id: string;
  current_job: CurrentJob | null;
  current_preflight: string | null;
};

export type Orgs = {
  [key: string]: Org;
};

const reducer = (orgs: Orgs = {}, action: OrgAction | LogoutAction): Orgs => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_ORG_JOBS_SUCCEEDED':
      return action.payload;
    case 'ORG_CHANGED': {
      const org = action.payload;
      return { ...orgs, [org.org_id]: org };
    }
  }
  return orgs;
};

export default reducer;
