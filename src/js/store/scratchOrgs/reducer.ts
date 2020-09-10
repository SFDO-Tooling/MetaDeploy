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
// todo
// const reducer = (scratchOrgs: any = {}, action: ScratchOrgsAction) => {
//   switch (action.type) {
// case 'SCRATCH_ORG_SPINNING':
// case 'SCRATCH_ORG_CREATED':
// case 'SCRATCH_ORG_ERROR': {
//       const org = action.payload as ScratchOrg;

//       const existingOrg = scratchOrgs[org];
//       return {
//         ...scratchOrgs,
//         [org.plan]: action.payload,
//       };
//     }
//   }
//   return scratchOrgs;
// };
const reducer = (
  scratchOrgs: ScratchOrgState = {},
  action: ScratchOrgsAction,
): ScratchOrgState => {
  switch (action.type) {
    case 'SCRATCH_ORG_ERROR':
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_CREATED': {
      const org = action.payload;
      const existingorg = scratchOrgs[org.plan];
      if (!existingorg) {
        return { [org.plan]: org };
      }
      return scratchOrgs;
    }
  }
  return scratchOrgs;
};

export default reducer;
