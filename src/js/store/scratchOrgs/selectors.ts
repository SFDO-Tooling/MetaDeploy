import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { selectPlan } from '@/store/plans/selectors';
import { ScratchOrgState } from '@/store/scratchOrgs/reducer';

export const selectScratchOrgState = (appState: AppState): ScratchOrgState =>
  appState.scratchOrgs;

export const selectScratchOrgsByPlan = createSelector(
  [selectScratchOrgState, selectPlan],
  (orgs, plan) => {
    /* istanbul ignore else */
    if (plan) {
      return orgs[plan.id];
    }
    return undefined;
  },
);
