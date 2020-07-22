import { createSelector } from 'reselect';

import type { InitialProps } from '@/components/utils';
import type { AppState } from '@/store';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
  PreflightsState,
} from '@/store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from '@/store/products/reducer';
import { selectProduct, selectVersion } from '@/store/products/selectors';

export const selectPlanSlug = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.planSlug;

export const selectPlan: (
  AppState,
  InitialProps,
) => PlanType | null = createSelector(
  [selectProduct, selectVersion, selectPlanSlug],
  (
    product: ProductType | null | void,
    version: VersionType | null,
    planSlug: ?string,
  ): PlanType | null => {
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
    const plan = additional_plans && additional_plans[planSlug];
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
