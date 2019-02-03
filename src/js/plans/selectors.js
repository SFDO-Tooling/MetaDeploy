// @flow

import { createSelector } from 'reselect';

import { selectProduct, selectVersion } from 'products/selectors';
import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
  PreflightsState,
} from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const selectPlanSlug = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.planSlug;

export const selectPlan: (
  AppState,
  InitialProps,
) => PlanType | null = createSelector(
  [selectProduct, selectVersion, selectPlanSlug],
  (
    product: ProductType | null,
    version: VersionType | null,
    planSlug: ?string,
  ): PlanType | null => {
    if (!product || !version || !planSlug) {
      return null;
    }
    if (version.primary_plan.slug === planSlug) {
      return version.primary_plan;
    }
    if (version.secondary_plan && version.secondary_plan.slug === planSlug) {
      return version.secondary_plan;
    }
    const plan = version.additional_plans.find(p => p.slug === planSlug);
    return plan || null;
  },
);

const selectPreflightsState = (appState: AppState): PreflightsState =>
  appState.preflights;

export const selectPreflight: (
  AppState,
  InitialProps,
) => ?PreflightType = createSelector(
  [selectPreflightsState, selectPlan],
  (preflights: PreflightsState, plan: PlanType | null): ?PreflightType => {
    if (!plan) {
      return null;
    }
    // A `null` preflight means we already fetched and no prior preflight exists
    // An `undefined` preflight means we don't know whether a preflight exists
    return preflights[plan.id];
  },
);
