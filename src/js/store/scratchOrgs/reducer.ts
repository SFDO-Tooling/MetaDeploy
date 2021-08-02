import { ScratchOrgsAction } from '@/js/store/scratchOrgs/actions';
import { LogoutAction } from '@/js/store/user/actions';

export type ScratchOrg = {
  id: string;
  plan: string;
  status: 'started' | 'complete' | 'failed' | 'canceled';
  org_id: string | null;
  enqueued_at: string | null;
  created_at: string;
  edited_at: string;
  uuid: string;
  expires_at: string | null;
};

export type ScratchOrgState = {
  [key: string]: ScratchOrg | null;
};

const reducer = (
  scratchOrgs: ScratchOrgState = {},
  action: ScratchOrgsAction | LogoutAction,
): ScratchOrgState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_SCRATCH_ORG_SUCCEEDED': {
      const { plan, org } = action.payload;
      if (org) {
        return { [plan]: org };
      }
      return { ...scratchOrgs, [plan]: null };
    }
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_UPDATED': {
      const org = action.payload;
      const { plan } = org;
      const existingOrg = scratchOrgs[plan];
      if (existingOrg && existingOrg.edited_at > org.edited_at) {
        return scratchOrgs;
      }
      return { [plan]: org };
    }
    case 'SCRATCH_ORG_ERROR':
    case 'SCRATCH_ORG_FAILED': {
      const plan = action.payload;
      return { ...scratchOrgs, [plan]: null };
    }
  }
  return scratchOrgs;
};

export default reducer;
