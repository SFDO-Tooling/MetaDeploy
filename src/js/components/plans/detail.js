// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { CONSTANTS } from 'plans/reducer';
import { fetchPreflight, startPreflight } from 'plans/actions';
import { fetchVersion } from 'products/actions';
import {
  selectProduct,
  selectVersion,
  selectVersionLabel,
} from 'components/products/detail';
import { selectUserState } from 'components/header';
import { shouldFetchVersion, getLoadingOrNotFound } from 'products/utils';
import { startJob } from 'jobs/actions';

import BodyContainer from 'components/bodyContainer';
import CtaButton from 'components/plans/ctaButton';
import Header from 'components/plans/header';
import Intro from 'components/plans/intro';
import JobResults from 'components/plans/jobResults';
import PlanNotAllowed from 'components/products/notAllowed';
import ProductNotFound from 'components/products/product404';
import StepsTable from 'components/plans/stepsTable';
import Toasts from 'components/plans/toasts';
import UserInfo from 'components/plans/userInfo';

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
import type { User as UserType } from 'accounts/reducer';

export type SelectedSteps = Set<string>;
type Props = {
  ...InitialProps,
  user: UserType,
  product: ProductType | null,
  version: VersionType | null,
  versionLabel: ?string,
  plan: PlanType | null,
  preflight: ?PreflightType,
  doFetchVersion: typeof fetchVersion,
  doFetchPreflight: typeof fetchPreflight,
  doStartPreflight: typeof startPreflight,
  doStartJob: typeof startJob,
};
type State = {
  changedSteps: Map<string, boolean>,
};

const { RESULT_STATUS } = CONSTANTS;

class PlanDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { changedSteps: new Map() };
  }

  fetchVersionIfMissing() {
    const { product, version, versionLabel, doFetchVersion } = this.props;
    if (
      product &&
      versionLabel &&
      shouldFetchVersion({ product, version, versionLabel })
    ) {
      // Fetch version from API
      doFetchVersion({ product: product.id, label: versionLabel });
    }
  }

  fetchPreflightIfMissing() {
    const { user, plan, preflight, doFetchPreflight } = this.props;
    if (user && plan && preflight === undefined) {
      // Fetch most recent preflight result (if any exists)
      doFetchPreflight(plan.id);
    }
  }

  componentDidMount() {
    this.fetchVersionIfMissing();
    this.fetchPreflightIfMissing();
  }

  componentDidUpdate(prevProps) {
    const {
      product,
      version,
      versionLabel,
      user,
      plan,
      preflight,
    } = this.props;
    const versionChanged =
      product !== prevProps.product ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel;
    const preflightChanged =
      user !== prevProps.user ||
      plan !== prevProps.plan ||
      preflight !== prevProps.preflight;
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
    if (preflightChanged) {
      this.fetchPreflightIfMissing();
    }
  }

  handleStepsChange = (stepId: string, checked: boolean) => {
    const changedSteps = new Map(this.state.changedSteps);
    changedSteps.set(stepId, checked);
    this.setState({ changedSteps });
  };

  getSelectedSteps(): SelectedSteps {
    const { plan, preflight } = this.props;
    const selectedSteps = new Set();
    /* istanbul ignore if */
    if (!plan || !plan.steps) {
      return selectedSteps;
    }
    const { changedSteps } = this.state;
    for (const step of plan.steps) {
      const { id } = step;
      const result = preflight && preflight.results && preflight.results[id];
      let skipped, optional;
      if (result) {
        skipped = result.find(res => res.status === RESULT_STATUS.SKIP);
        optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
      }
      if (!skipped) {
        const required = step.is_required && !optional;
        const recommended = !required && step.is_recommended;
        const manuallyChecked = changedSteps.get(id) === true;
        const manuallyUnchecked = changedSteps.get(id) === false;
        if (
          required ||
          manuallyChecked ||
          (recommended && !manuallyUnchecked)
        ) {
          selectedSteps.add(id);
        }
      }
    }
    return selectedSteps;
  }

  render(): React.Node {
    const {
      history,
      user,
      product,
      version,
      versionLabel,
      plan,
      preflight,
      doStartPreflight,
      doStartJob,
    } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      version,
      versionLabel,
      plan,
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // this redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return <ProductNotFound />;
    }
    const selectedSteps = this.getSelectedSteps();
    return (
      <DocumentTitle title={`${plan.title} | ${product.title} | MetaDeploy`}>
        <>
          <Header product={product} version={version} plan={plan} />
          {product.is_allowed && plan.is_allowed ? (
            <BodyContainer>
              {preflight && user ? (
                <Toasts model={preflight} label="Pre-install validation" />
              ) : null}
              <Intro
                results={
                  preflight && user ? (
                    <JobResults
                      preflight={preflight}
                      label="Pre-install validation"
                      failMessage={
                        'After resolving all errors, ' +
                        'run the pre-install validation again.'
                      }
                    />
                  ) : null
                }
                cta={
                  plan.steps && plan.steps.length ? (
                    <CtaButton
                      history={history}
                      user={user}
                      productSlug={product.slug}
                      versionLabel={version.label}
                      plan={plan}
                      preflight={preflight}
                      selectedSteps={selectedSteps}
                      doStartPreflight={doStartPreflight}
                      doStartJob={doStartJob}
                    />
                  ) : null
                }
                preMessage={
                  plan.preflight_message ? (
                    // These messages are pre-cleaned by the API
                    <div
                      dangerouslySetInnerHTML={{
                        __html: plan.preflight_message,
                      }}
                    />
                  ) : null
                }
              />
              <UserInfo user={user} />
              {plan.steps && plan.steps.length ? (
                <StepsTable
                  user={user}
                  plan={plan}
                  preflight={preflight}
                  selectedSteps={selectedSteps}
                  handleStepsChange={this.handleStepsChange}
                />
              ) : null}
            </BodyContainer>
          ) : (
            <PlanNotAllowed
              isLoggedIn={user !== null}
              message={
                product.not_allowed_instructions ||
                plan.not_allowed_instructions
              }
              link={
                <>
                  Try{' '}
                  <Link to={routes.version_detail(product.slug, version.label)}>
                    another plan
                  </Link>{' '}
                  from that product version
                </>
              }
            />
          )}
        </>
      </DocumentTitle>
    );
  }
}

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

const selectPreflight = createSelector(
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

const select = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  preflight: selectPreflight(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
  doFetchPreflight: fetchPreflight,
  doStartPreflight: startPreflight,
  doStartJob: startJob,
};

const WrappedPlanDetail: React.ComponentType<InitialProps> = connect(
  select,
  actions,
)(PlanDetail);

export default WrappedPlanDetail;
