import i18n from 'i18next';
import { find } from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { connect, ConnectedProps } from 'react-redux';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import BackLink from '@/components/backLink';
import BodyContainer from '@/components/bodyContainer';
import Header from '@/components/header';
import CtaButton from '@/components/plans/ctaButton';
import PageHeader from '@/components/plans/header';
import Intro from '@/components/plans/intro';
import PreflightResults, {
  ErrorIcon,
  WarningIcon,
} from '@/components/plans/preflightResults';
import StepsTable from '@/components/plans/stepsTable';
import Toasts from '@/components/plans/toasts';
import UserInfo from '@/components/plans/userInfo';
import PlanNotAllowed from '@/components/products/notAllowed';
import OldVersionWarning from '@/components/products/oldVersionWarning';
import ProductNotFound from '@/components/products/product404';
import {
  getLoadingOrNotFound,
  shouldFetchPlan,
  shouldFetchVersion,
} from '@/components/utils';
import { AppState } from '@/store';
import { startJob } from '@/store/jobs/actions';
import { selectOrgs } from '@/store/org/selectors';
import { fetchPreflight, startPreflight } from '@/store/plans/actions';
import { CONSTANTS, Step } from '@/store/plans/reducer';
import {
  selectPlan,
  selectPlanSlug,
  selectPreflight,
} from '@/store/plans/selectors';
import {
  fetchPlan,
  fetchProduct,
  fetchVersion,
} from '@/store/products/actions';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabel,
} from '@/store/products/selectors';
import { fetchScratchOrg, spinScratchOrg } from '@/store/scratchOrgs/actions';
import { selectScratchOrg } from '@/store/scratchOrgs/selectors';
import { logout } from '@/store/user/actions';
import { selectUserState } from '@/store/user/selectors';
import { SCRATCH_ORG_STATUSES, SUPPORTED_ORGS } from '@/utils/constants';
import routes from '@/utils/routes';

const select = (appState: AppState, props: RouteComponentProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  planSlug: selectPlanSlug(appState, props),
  preflight: selectPreflight(appState, props),
  orgs: selectOrgs(appState),
  scratchOrg: selectScratchOrg(appState, props),
});

const actions = {
  doFetchProduct: fetchProduct,
  doFetchVersion: fetchVersion,
  doFetchPlan: fetchPlan,
  doFetchPreflight: fetchPreflight,
  doStartPreflight: startPreflight,
  doStartJob: startJob,
  doSpinScratchOrg: spinScratchOrg,
  doFetchScratchOrg: fetchScratchOrg,
  doLogout: logout,
};

const connector = connect(select, actions);

type PropsFromRedux = ConnectedProps<typeof connector>;

export type SelectedSteps = Set<string>;
type Props = PropsFromRedux & RouteComponentProps;
type State = {
  changedSteps: Map<string, boolean>;
};

const { RESULT_STATUS } = CONSTANTS;

class PlanDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { changedSteps: new Map() };
  }

  fetchProductIfMissing() {
    const { product, productSlug, doFetchProduct } = this.props;
    if (product === undefined && productSlug) {
      // Fetch product from API
      doFetchProduct({ slug: productSlug });
    }
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

  fetchPlanIfMissing() {
    const { product, version, plan, planSlug, doFetchPlan } = this.props;
    if (
      product &&
      version &&
      planSlug &&
      shouldFetchPlan({ version, plan, planSlug })
    ) {
      // Fetch plan from API
      doFetchPlan({
        product: product.id,
        version: version.id,
        slug: planSlug,
      });
    }
  }

  fetchPreflightIfMissing() {
    const { plan, preflight, doFetchPreflight } = this.props;
    if (preflight === undefined && plan?.requires_preflight) {
      // Fetch most recent preflight result (if any exists)
      doFetchPreflight(plan.id);
    }
  }

  fetchScratchOrgIfMissing() {
    const { plan, scratchOrg, doFetchScratchOrg } = this.props;
    const canCreateOrg = Boolean(
      window.GLOBALS.SCRATCH_ORGS_AVAILABLE &&
        plan?.supported_orgs !== SUPPORTED_ORGS.Persistent,
    );
    if (plan && canCreateOrg && scratchOrg === undefined) {
      doFetchScratchOrg(plan.id);
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
    this.fetchVersionIfMissing();
    this.fetchPlanIfMissing();
    this.fetchPreflightIfMissing();
    this.fetchScratchOrgIfMissing();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      preflight,
      scratchOrg,
    } = this.props;
    const productChanged =
      product !== prevProps.product || productSlug !== prevProps.productSlug;
    const versionChanged =
      productChanged ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel;
    const planChanged =
      versionChanged ||
      plan !== prevProps.plan ||
      planSlug !== prevProps.planSlug;
    const preflightChanged = preflight !== prevProps.preflight;
    const scratchOrgChanged = scratchOrg !== prevProps.scratchOrg;
    if (productChanged) {
      this.fetchProductIfMissing();
    }
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
    if (planChanged || preflightChanged) {
      this.fetchPreflightIfMissing();
    }
    if (planChanged || scratchOrgChanged) {
      this.fetchScratchOrgIfMissing();
    }
    if (planChanged) {
      this.fetchPlanIfMissing();
    }
  }

  handleStepsChange = (stepId: string, checked: boolean) => {
    const changedSteps = new Map(this.state.changedSteps);
    changedSteps.set(stepId, checked);
    this.setState({ changedSteps });
  };

  getVisibleSteps(): Step[] {
    const { plan, preflight } = this.props;
    const steps: Step[] = [];
    if (!plan || !plan.steps) {
      return steps;
    }
    for (const step of plan.steps) {
      const { id } = step;
      const results = preflight?.results?.[id];
      if (results) {
        for (const result of results) {
          const stepAlreadyIncluded = (stepId: string) =>
            steps.some((s) => s.id === stepId);
          if (
            (!result || result.status !== RESULT_STATUS.HIDE) &&
            !stepAlreadyIncluded(id)
          ) {
            steps.push(step);
          }
        }
      } else {
        steps.push(step);
      }
    }
    return steps;
  }

  getSelectedSteps(): SelectedSteps {
    const { plan, preflight } = this.props;
    const selectedSteps = new Set<string>();

    /* istanbul ignore if */
    if (!plan || !plan.steps) {
      return selectedSteps;
    }
    const { changedSteps } = this.state;
    for (const step of plan.steps) {
      const { id } = step;
      const results = preflight?.results?.[id] || [];
      const hidden = results.some(
        (result) => result.status === RESULT_STATUS.HIDE,
      );
      const optional = results.some(
        (result) => result.status === RESULT_STATUS.OPTIONAL,
      );
      const skipped = results.some(
        (result) => result.status === RESULT_STATUS.SKIP,
      );

      if (!hidden && !skipped) {
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

  getPostMessage() {
    const { user, product, version, plan, orgs } = this.props;

    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return null;
    }

    const canLogin = plan.supported_orgs !== SUPPORTED_ORGS.Scratch;
    if (canLogin && user && !user.org_type) {
      return (
        <>
          <div className="slds-p-bottom_xx-small">
            <ErrorIcon />
            <span className="slds-text-color_error">
              {i18n.t(
                'Oops! It looks like you don’t have permissions to run an installation on this org.',
              )}
            </span>
          </div>
          <p>
            {i18n.t(
              'Please contact an Admin within your org or use the button below to log in with a different org.',
            )}
          </p>
        </>
      );
    }

    const currentJob = find(orgs, (org) => org.current_job !== null)
      ?.current_job;
    const currentPreflight = find(orgs, (org) => org.current_preflight !== null)
      ?.current_preflight;
    if (currentJob) {
      const { product_slug, version_label, plan_slug, id } = currentJob;
      return (
        <p>
          <WarningIcon />
          <span>
            <Trans i18nKey="installationCurrentlyRunning">
              An installation is currently running on this org.{' '}
              <Link
                to={routes.job_detail(
                  product_slug,
                  version_label,
                  plan_slug,
                  id,
                )}
              >
                View the running installation.
              </Link>
            </Trans>
          </span>
        </p>
      );
    }
    if (currentPreflight) {
      return (
        <p>
          <WarningIcon />
          <span>
            {i18n.t(
              'A pre-install validation is currently running on this org.',
            )}
          </span>
        </p>
      );
    }
    return null;
  }

  getCTA(selectedSteps: SelectedSteps) {
    const {
      history,
      user,
      product,
      version,
      plan,
      preflight,
      orgs,
      scratchOrg,
      doStartPreflight,
      doStartJob,
      doSpinScratchOrg,
      doLogout,
    } = this.props;

    /* istanbul ignore if */
    if (!product || !version || !plan) {
      return null;
    }
    if (plan.steps?.length) {
      const hasCurrentJob = Boolean(
        find(orgs, (org) => org.current_job !== null),
      );
      const hasCurrentPreflight = Boolean(
        find(orgs, (org) => org.current_preflight !== null),
      );
      return (
        <CtaButton
          history={history}
          user={user}
          productSlug={product.slug}
          clickThroughAgreement={product.click_through_agreement}
          versionLabel={version.label}
          plan={plan}
          preflight={preflight}
          selectedSteps={selectedSteps}
          scratchOrg={scratchOrg}
          preventAction={Boolean(
            hasCurrentJob ||
              hasCurrentPreflight ||
              scratchOrg?.status === SCRATCH_ORG_STATUSES.started,
          )}
          doStartPreflight={doStartPreflight}
          doStartJob={doStartJob}
          doSpinScratchOrg={doSpinScratchOrg}
          doLogout={doLogout}
        />
      );
    }
    return null;
  }

  render() {
    const {
      user,
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      preflight,
      scratchOrg,
      history,
    } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      route: 'plan_detail',
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

    const steps = this.getVisibleSteps();
    const selectedSteps = this.getSelectedSteps();

    const isMostRecent =
      product.most_recent_version &&
      new Date(version.created_at) >=
        new Date(product.most_recent_version.created_at);
    const canInstall = Boolean(
      scratchOrg?.status === SCRATCH_ORG_STATUSES.complete ||
        user?.valid_token_for,
    );

    return (
      <DocumentTitle
        title={`${plan.title} | ${product.title} | ${window.SITE_NAME}`}
      >
        <>
          <Header
            history={history}
            hideLogin={plan.supported_orgs === SUPPORTED_ORGS.Scratch}
          />
          <PageHeader
            product={product}
            version={version}
            plan={plan}
            userLoggedIn={Boolean(user?.valid_token_for)}
            scratchOrgCreated={Boolean(
              scratchOrg?.status === SCRATCH_ORG_STATUSES.complete,
            )}
            preflightStatus={preflight?.status}
            preflightIsValid={Boolean(preflight?.is_valid)}
            preflightIsReady={Boolean(preflight?.is_ready)}
          />
          {product.is_allowed && plan.is_allowed ? (
            <BodyContainer>
              {product.most_recent_version && !isMostRecent ? (
                <OldVersionWarning
                  link={routes.version_detail(
                    product.slug,
                    product.most_recent_version.label,
                  )}
                />
              ) : null}
              {preflight && (scratchOrg || user) ? (
                <Toasts preflight={preflight} label="Pre-install validation" />
              ) : null}
              <Intro
                averageDuration={plan.average_duration}
                isProductionOrg={Boolean(user?.is_production_org)}
                preMessage={
                  plan.preflight_message ? (
                    // These messages are pre-cleaned by the API
                    <div
                      className="markdown"
                      dangerouslySetInnerHTML={{
                        __html: plan.preflight_message,
                      }}
                    />
                  ) : null
                }
                results={
                  preflight && (scratchOrg || user) ? (
                    <PreflightResults preflight={preflight} />
                  ) : null
                }
                postMessage={this.getPostMessage()}
                cta={this.getCTA(selectedSteps)}
                backLink={
                  <BackLink
                    label={i18n.t('Select a different plan')}
                    url={routes.version_detail(product.slug, version.label)}
                    className="slds-p-top_small"
                  />
                }
              />
              <UserInfo user={user} plan={plan} scratchOrg={scratchOrg} />
              {plan.steps?.length ? (
                <StepsTable
                  plan={plan}
                  preflight={preflight}
                  steps={steps}
                  selectedSteps={selectedSteps}
                  canInstall={canInstall}
                  handleStepsChange={this.handleStepsChange}
                />
              ) : null}
            </BodyContainer>
          ) : (
            <PlanNotAllowed
              isLoggedIn={user !== null}
              message={plan.not_allowed_instructions}
              link={
                <Trans i18nKey="planNotAllowed">
                  Try{' '}
                  <Link to={routes.version_detail(product.slug, version.label)}>
                    another plan
                  </Link>{' '}
                  from that product version
                </Trans>
              }
            />
          )}
        </>
      </DocumentTitle>
    );
  }
}

const WrappedPlanDetail = connector(withRouter(PlanDetail));

export default WrappedPlanDetail;
