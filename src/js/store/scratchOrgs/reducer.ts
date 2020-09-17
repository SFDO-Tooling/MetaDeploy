import { ScratchOrgsAction } from './actions';

export type ScratchOrg = {
  canceled_at: null;
  config: null;
  created_at: string;
  edited_at: string;
  email: string;
  enqueued_at: string;
  id: string;
  job_id: string;
  plan: string;
  status: string;
};
export type ScratchOrgState = {
  [key: string]: ScratchOrg;
};

const reducer = (
  scratchOrgs: ScratchOrgState = {},
  action: ScratchOrgsAction,
): ScratchOrgState => {
  switch (action.type) {
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_CREATED': {
      const org = action.payload;
      const existingorg = org[org.plan];
      if (!existingorg) {
        return { [org.plan]: org };
      }
      return scratchOrgs;
    }
    case 'SCRATCH_ORG_ERROR': {
      return {};
    }
  }
  return scratchOrgs;
};

export default reducer;
