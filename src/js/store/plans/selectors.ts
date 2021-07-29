import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/js/store';
import { Plan, Preflight, PreflightsState } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';
import { selectProduct, selectVersion } from '@/js/store/products/selectors';

export const selectPlanSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ planSlug?: string }>,
): string | null | undefined => params.planSlug;

export const selectPlan = createSelector(
  [selectProduct, selectVersion, selectPlanSlug],
  (
    product: Product | null | void,
    version: Version | null,
    planSlug: string | null | undefined,
  ): Plan | null => {
    if (!product || !version || !planSlug) {
      return null;
    }
    const { primary_plan, secondary_plan, additional_plans } = version;
    if (
      primary_plan &&
      (primary_plan.slug === planSlug ||
        primary_plan.old_slugs.includes(planSlug))
    ) {
      return primary_plan;
    }
    if (
      secondary_plan &&
      (secondary_plan.slug === planSlug ||
        secondary_plan.old_slugs.includes(planSlug))
    ) {
      return secondary_plan;
    }
    const plan = additional_plans?.[planSlug];
    return plan || null;
  },
);

const selectPreflightsState = (appState: AppState): PreflightsState =>
  appState.preflights;

export const selectPreflight = createSelector(
  [selectPreflightsState, selectPlan],
  (
    preflights: PreflightsState,
    plan: Plan | null,
  ): Preflight | null | undefined => {
    if (!plan) {
      return null;
    }
    // A `null` preflight means we already fetched and no prior preflight exists
    // An `undefined` preflight means we don't know whether a preflight exists
    return preflights[plan.id];
  },
);
