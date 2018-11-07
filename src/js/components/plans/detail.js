// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
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
import { shouldFetchVersion, gatekeeper } from 'products/utils';
import { startJob } from 'jobs/actions';

import BodyContainer from 'components/bodyContainer';
import CtaButton from 'components/plans/ctaButton';
import PreflightResults from 'components/plans/preflightResults';
import ProductIcon from 'components/products/icon';
import ProductNotFound from 'components/products/product404';
import StepsTable from 'components/plans/stepsTable';
import Toasts from 'components/plans/toasts';
import UserInfo from 'components/plans/userInfo';

import type { Match } from 'react-router-dom';
import type { AppState } from 'app/reducer';
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

export type SelectedSteps = Set<number>;
type InitialProps = { match: Match };
type Props = {
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
  changedSteps: Map<number, boolean>,
};

const { RESULT_STATUS } = CONSTANTS;

class PlanDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { changedSteps: new Map() };
  }

  componentDidMount() {
    const {
      user,
      product,
      version,
      versionLabel,
      plan,
      preflight,
      doFetchVersion,
      doFetchPreflight,
    } = this.props;
    if (
      product &&
      versionLabel &&
      shouldFetchVersion({ product, version, versionLabel })
    ) {
      // Fetch version from API
      doFetchVersion({ product: product.id, label: versionLabel });
    }

    if (user && plan && preflight === undefined) {
      // Fetch most recent preflight result (if any exists)
      doFetchPreflight(plan.id);
    }
  }

  handleStepsChange = (stepId: number, checked: boolean) => {
    const changedSteps = new Map(this.state.changedSteps);
    changedSteps.set(stepId, checked);
    this.setState({ changedSteps });
  };

  getSelectedSteps(): SelectedSteps {
    const { plan, preflight } = this.props;
    /* istanbul ignore if */
    if (!plan) {
      return new Set();
    }
    const { changedSteps } = this.state;
    const selectedSteps = new Set();
    for (const step of plan.steps) {
      const { id } = step;
      const idString = id.toString();
      const result =
        preflight && preflight.results && preflight.results[idString];
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
      user,
      product,
      version,
      versionLabel,
      plan,
      preflight,
      doStartPreflight,
      doStartJob,
    } = this.props;
    const blocked = gatekeeper({
      product,
      version,
      versionLabel,
      plan,
    });
    if (blocked !== false) {
      return blocked;
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
          <PageHeader
            className="page-header
              slds-p-around_x-large"
            title={plan.title}
            trail={[
              <Link
                to={routes.version_detail(product.slug, version.label)}
                key={product.slug}
              >
                {product.title}, {version.label}
              </Link>,
            ]}
            icon={<ProductIcon item={product} />}
            variant="objectHome"
          />
          <BodyContainer>
            {preflight && user ? <Toasts preflight={preflight} /> : null}
            <div
              className="slds-p-around_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2"
            >
              <div className="slds-text-longform">
                <h3 className="slds-text-heading_small">{plan.title}</h3>
                {plan.preflight_message ? (
                  <p>{plan.preflight_message}</p>
                ) : null}
                {preflight && user ? (
                  <PreflightResults preflight={preflight} />
                ) : null}
              </div>
              {plan.steps.length ? (
                <CtaButton
                  user={user}
                  plan={plan}
                  preflight={preflight}
                  selectedSteps={selectedSteps}
                  doStartPreflight={doStartPreflight}
                  doStartJob={doStartJob}
                />
              ) : null}
            </div>
            <div
              className="slds-p-around_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2"
            >
              <UserInfo user={user} />
            </div>
            {plan.steps.length ? (
              <div
                className="slds-p-around_medium
                  slds-size_1-of-1"
              >
                <StepsTable
                  user={user}
                  plan={plan}
                  preflight={preflight}
                  selectedSteps={selectedSteps}
                  handleStepsChange={this.handleStepsChange}
                />
              </div>
            ) : null}
          </BodyContainer>
        </>
      </DocumentTitle>
    );
  }
}

const selectPlanSlug = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.planSlug;

const selectPlan = createSelector(
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
    return preflights[plan.id.toString()];
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
