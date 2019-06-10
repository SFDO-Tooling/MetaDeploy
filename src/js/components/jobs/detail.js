// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import DocumentTitle from 'react-document-title';
import i18n from 'i18next';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { CONSTANTS } from 'store/plans/reducer';
import { fetchJob, requestCancelJob, updateJob } from 'store/jobs/actions';
import { fetchPlan, fetchProduct, fetchVersion } from 'store/products/actions';
import { selectJob, selectJobId } from 'store/jobs/selectors';
import { selectPlan, selectPlanSlug } from 'store/plans/selectors';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabel,
} from 'store/products/selectors';
import { selectUserState } from 'store/user/selectors';
import {
  getLoadingOrNotFound,
  shouldFetchPlan,
  shouldFetchVersion,
} from 'components/utils';
import BackLink from 'components/backLink';
import BodyContainer from 'components/bodyContainer';
import CtaButton from 'components/jobs/ctaButton';
import Header from 'components/header';
import Intro from 'components/plans/intro';
import JobMessage from 'components/jobs/jobMessage';
import JobResults from 'components/jobs/jobResults';
import PageHeader from 'components/plans/header';
import ProductNotFound from 'components/products/product404';
import ProgressBar from 'components/jobs/progressBar';
import ShareModal from 'components/jobs/shareModal';
import StepsTable from 'components/plans/stepsTable';
import Toasts from 'components/plans/toasts';
import UserInfo from 'components/jobs/userInfo';
import { LabelWithSpinner } from 'components/plans/ctaButton';
import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type { Job as JobType } from 'store/jobs/reducer';
import type { Plan as PlanType } from 'store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';
import type { User as UserType } from 'store/user/reducer';

type Props = {
  ...InitialProps,
  user: UserType,
  product: ProductType | null | void,
  productSlug: ?string,
  version: VersionType | null,
  versionLabel: ?string,
  plan: PlanType | null,
  planSlug: ?string,
  job: ?JobType,
  jobId: ?string,
  doFetchProduct: typeof fetchProduct,
  doFetchVersion: typeof fetchVersion,
  doFetchPlan: typeof fetchPlan,
  doFetchJob: typeof fetchJob,
  doUpdateJob: typeof updateJob,
  doRequestCancelJob: (id: string) => Promise<any>,
};
type State = {
  modalOpen: boolean,
  canceling: boolean,
};

class JobDetail extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { modalOpen: false, canceling: false };
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

  fetchJobIfMissing() {
    const { job, jobId, doFetchJob, product, versionLabel, plan } = this.props;
    if (product && versionLabel && plan && jobId && job === undefined) {
      // Fetch job from API
      doFetchJob({
        jobId,
        productSlug: product.slug,
        versionLabel,
        planSlug: plan.slug,
      });
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
    this.fetchVersionIfMissing();
    this.fetchPlanIfMissing();
    this.fetchJobIfMissing();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      job,
      jobId,
    } = this.props;
    const prevJob = prevProps.job;
    const jobIdChanged = jobId !== prevProps.jobId;
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
    const jobChanged = planChanged || job !== prevJob || jobIdChanged;
    if (productChanged) {
      this.fetchProductIfMissing();
    }
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
    if (planChanged) {
      this.fetchPlanIfMissing();
    }
    if (jobChanged) {
      this.fetchJobIfMissing();
    }
    // If the job has changed status and is failed, automatically open modal
    if (job && !jobIdChanged) {
      const { modalOpen } = prevState;
      const statusChanged = prevJob && prevJob.status !== job.status;
      const hasError = job.error_count !== undefined && job.error_count > 0;
      if (
        !modalOpen &&
        statusChanged &&
        (hasError || job.status === CONSTANTS.STATUS.FAILED)
      ) {
        this.openModal();
      }
    }
  }

  toggleModal = (isOpen: boolean) => {
    this.setState({ modalOpen: isOpen });
  };

  openModal = () => {
    this.toggleModal(true);
  };

  requestCancelJob = () => {
    const { job, doRequestCancelJob } = this.props;
    /* istanbul ignore if */
    if (!job) {
      return;
    }
    doRequestCancelJob(job.id).then(() => {
      this.setState({ canceling: true });
    });
  };

  getCancelBtn(): React.Node {
    const { user, job } = this.props;
    /* istanbul ignore if */
    if (!job) {
      return null;
    }
    if (job.status === CONSTANTS.STATUS.STARTED && user && user.is_staff) {
      const { canceling } = this.state;
      if (canceling) {
        return (
          <Button
            label={
              <LabelWithSpinner
                label={i18n.t('Canceling Installation…')}
                variant="base"
                size="x-small"
              />
            }
            disabled
          />
        );
      }
      return (
        <Button
          label={i18n.t('Cancel Installation')}
          variant="text-destructive"
          onClick={this.requestCancelJob}
        />
      );
    }
    return null;
  }

  controls = () => (
    <>
      {this.getCancelBtn()}
      <Button
        label={i18n.t('Share Installation')}
        iconCategory="utility"
        iconName="share"
        iconPosition="left"
        onClick={this.openModal}
      />
    </>
  );

  render(): React.Node {
    const {
      user,
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      job,
      jobId,
      history,
      doUpdateJob,
    } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      job,
      jobId,
      isLoggedIn: user !== null,
      route: 'job_detail',
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // this redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
    /* istanbul ignore if */
    if (!product || !version || !plan || !job) {
      return <ProductNotFound />;
    }
    const linkToPlan = routes.plan_detail(
      product.slug,
      version.label,
      plan.slug,
    );
    const { canceling } = this.state;
    return (
      <DocumentTitle
        title={`${i18n.t('Installation')} | ${plan.title} | ${
          product.title
        } | ${window.SITE_NAME}`}
      >
        <>
          <Header history={history} jobId={jobId} />
          <PageHeader
            product={product}
            version={version}
            plan={plan}
            job={job}
            onRenderControls={this.controls}
          />
          <ShareModal
            isOpen={this.state.modalOpen}
            job={job}
            plan={plan}
            toggleModal={this.toggleModal}
            updateJob={doUpdateJob}
          />
          <BodyContainer>
            <Toasts job={job} label={i18n.t('Installation')} />
            <Intro
              averageDuration={plan.average_duration}
              isProductionOrg={job.is_production_org}
              results={<JobResults job={job} openModal={this.openModal} />}
              cta={
                <CtaButton
                  job={job}
                  linkToPlan={linkToPlan}
                  canceling={canceling}
                />
              }
              postMessage={<JobMessage job={job} />}
              backLink={
                job.status === CONSTANTS.STATUS.STARTED ? null : (
                  <BackLink
                    label={i18n.t('Install another product')}
                    url={routes.product_list()}
                    className="slds-p-top_small"
                  />
                )
              }
            />
            <UserInfo job={job} />
            <ProgressBar job={job} />
            {plan.steps && plan.steps.length ? (
              <StepsTable plan={plan} job={job} />
            ) : null}
          </BodyContainer>
        </>
      </DocumentTitle>
    );
  }
}

const select = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  planSlug: selectPlanSlug(appState, props),
  job: selectJob(appState, props),
  jobId: selectJobId(appState, props),
});

const actions = {
  doFetchProduct: fetchProduct,
  doFetchVersion: fetchVersion,
  doFetchPlan: fetchPlan,
  doFetchJob: fetchJob,
  doUpdateJob: updateJob,
  doRequestCancelJob: requestCancelJob,
};

const WrappedJobDetail: React.ComponentType<InitialProps> = connect(
  select,
  actions,
)(JobDetail);

export default WrappedJobDetail;
