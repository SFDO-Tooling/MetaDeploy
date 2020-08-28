import { ScratchOrgsAction } from './actions';

export type ScratchOrg = {
  // todo
  id: string;
};
// todo
const reducer = (scratchOrgs: any = {}, action: ScratchOrgsAction) => {
  switch (action.type) {
    case 'SCRATCH_ORG_SPINNING':
    case 'SCRATCH_ORG_CREATED':
    case 'SCRATCH_ORG_ERROR': {
      return scratchOrgs;
    }
  }
  return scratchOrgs;
};

export default reducer;
