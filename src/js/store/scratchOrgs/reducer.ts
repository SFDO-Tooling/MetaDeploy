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
  [key: string]: ScratchOrg | null;
};

const reducer = (
  scratchOrgs: ScratchOrgState = {},
  action: ScratchOrgsAction,
): ScratchOrgState => {
  switch (action.type) {
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_CREATED': {
      const org = action.payload;
      return { ...scratchOrgs, [org.plan]: org };
    }
    case 'SCRATCH_ORG_ERROR': {
      const { id } = action.payload;
      return { ...scratchOrgs, [id]: null };
    }
  }
  return scratchOrgs;
};

export default reducer;
