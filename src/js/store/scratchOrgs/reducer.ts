import { ScratchOrgsAction } from '@/store/scratchOrgs/actions';
import { LogoutAction } from '@/store/user/actions';

export type ScratchOrg = {
  id: string;
  plan: string;
  status: 'started' | 'complete' | 'failed' | 'canceled';
  email: string;
  org_id: string | null;
  enqueued_at: string | null;
  created_at: string;
  edited_at: string;
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
      return { ...scratchOrgs, [plan]: org };
    }
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_CREATED':
    case 'SCRATCH_ORG_FAILED': {
      const org = action.payload;
      const { plan } = org;
      const existingOrg = scratchOrgs[plan];
      if (!existingOrg || org.edited_at > existingOrg.edited_at) {
        return { ...scratchOrgs, [plan]: org };
      }
      return scratchOrgs;
    }
    case 'SCRATCH_ORG_ERROR': {
      const plan = action.payload;
      return { ...scratchOrgs, [plan]: null };
    }
  }
  return scratchOrgs;
};

export default reducer;
