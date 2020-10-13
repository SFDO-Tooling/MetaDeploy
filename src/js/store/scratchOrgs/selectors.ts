import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { selectPlan } from '@/store/plans/selectors';
import { ScratchOrg, ScratchOrgState } from '@/store/scratchOrgs/reducer';

export const selectScratchOrgState = (appState: AppState): ScratchOrgState =>
  appState.scratchOrgs;

export const selectScratchOrg = createSelector(
  [selectScratchOrgState, selectPlan],
  (orgs, plan): ScratchOrg | null | undefined => {
    if (!plan) {
      return null;
    }
    // A `null` org means we already fetched and no prior org exists
    // An `undefined` org means we don't know whether an org exists
    return orgs[plan.id];
  },
);
