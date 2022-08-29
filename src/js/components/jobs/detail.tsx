import Button from '@salesforce/design-system-react/components/button';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React, { Component } from 'react';
import DocumentTitle from 'react-document-title';
import { WithTranslation, withTranslation } from 'react-i18next';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Job } from 'src/js/store/jobs/reducer';

import BackLink from '@/js/components/backLink';
import BodyContainer from '@/js/components/bodyContainer';
import Header from '@/js/components/header';
import CtaButton from '@/js/components/jobs/ctaButton';
import JobMessage from '@/js/components/jobs/jobMessage';
import JobResults from '@/js/components/jobs/jobResults';
import ProgressBar from '@/js/components/jobs/progressBar';
import ShareModal from '@/js/components/jobs/shareModal';
import UserInfo from '@/js/components/jobs/userInfo';
import { LabelWithSpinner } from '@/js/components/plans/ctaButton';
import PageHeader from '@/js/components/plans/header';
import Intro from '@/js/components/plans/intro';
import StepsTable from '@/js/components/plans/stepsTable';
import Toasts from '@/js/components/plans/toasts';
import ProductNotFound from '@/js/components/products/product404';
import {
  getLoadingOrNotFound,
  shouldFetchPlan,
  shouldFetchVersion,
} from '@/js/components/utils';
import { AppState } from '@/js/store';
import { fetchJob, requestCancelJob, updateJob } from '@/js/store/jobs/actions';
import { selectJob, selectJobId } from '@/js/store/jobs/selectors';
import { CONSTANTS } from '@/js/store/plans/reducer';
import { selectPlan, selectPlanSlug } from '@/js/store/plans/selectors';
import {
  fetchPlan,
  fetchProduct,
  fetchVersion,
} from '@/js/store/products/actions';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabel,
} from '@/js/store/products/selectors';
import { fetchScratchOrg } from '@/js/store/scratchOrgs/actions';
import { selectScratchOrg } from '@/js/store/scratchOrgs/selectors';
import { selectUserState } from '@/js/store/user/selectors';
import { getVersionLabel } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

const select = (appState: AppState, props: RouteComponentProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  planSlug: selectPlanSlug(appState, props),
  job: selectJob(appState, props),
  jobId: selectJobId(appState, props),
  scratchOrg: selectScratchOrg(appState, props),
});

const actions = {
  doFetchProduct: fetchProduct,
  doFetchVersion: fetchVersion,
  doFetchPlan: fetchPlan,
  doFetchJob: fetchJob,
  doUpdateJob: updateJob,
  doRequestCancelJob: requestCancelJob,
  doFetchScratchOrg: fetchScratchOrg,
};

const connector = connect(select, actions);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & RouteComponentProps & WithTranslation;

type State = {
  modalOpen: boolean;
  canceling: boolean;
};

class JobDetail extends Component<Props, State> {
  // unmount -- we just want to prevent a post-unmount state update after the
  // action finishes.
  // https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
  _isMounted!: boolean;

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

  fetchScratchOrgIfMissing() {
    const { job, plan, scratchOrg, doFetchScratchOrg } = this.props;
    const isScratchOrg = Boolean(job?.org_id && !job.creator);
    if (plan && isScratchOrg && scratchOrg === undefined) {
      doFetchScratchOrg(plan.id);
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
    this.fetchVersionIfMissing();
    this.fetchPlanIfMissing();
    this.fetchJobIfMissing();
    this.fetchScratchOrgIfMissing();
    this._isMounted = true;
  }

  /* istanbul ignore next */
  componentWillUnMount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      job,
      jobId,
      scratchOrg,
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
    const scratchOrgChanged = jobChanged || scratchOrg !== prevProps.scratchOrg;
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
    if (scratchOrgChanged) {
      this.fetchScratchOrgIfMissing();
    }
    // If the job has changed status and is failed (or complete on a scratch org
    // job), automatically open modal
    if (job && !jobIdChanged) {
      const { modalOpen } = prevState;
      const statusChanged = prevJob && prevJob.status !== job.status;
      const hasError = job.error_count !== undefined && job.error_count > 0;
      const isCompleteOnScratchOrg =
        scratchOrg?.org_id === job.org_id &&
        job.status === CONSTANTS.STATUS.COMPLETE;
      if (
        !modalOpen &&
        statusChanged &&
        (hasError ||
          job.status === CONSTANTS.STATUS.FAILED ||
          isCompleteOnScratchOrg)
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
      /* istanbul ignore else */
      if (this._isMounted) {
        this.setState({ canceling: true });
      }
    });
  };

  getCancelBtn() {
    const { t, user, job } = this.props;

    /* istanbul ignore if */
    if (!job) {
      return null;
    }
    if (job.status === CONSTANTS.STATUS.STARTED && user?.is_staff) {
      const { canceling } = this.state;
      if (canceling) {
        return (
          <Button
            label={
              <LabelWithSpinner
                label={t('Canceling Installation…')}
                variant="base"
                size="x-small"
              />
            }
            className="v-align-center"
            disabled
          />
        );
      }
      return (
        <Button
          label={t('Cancel Installation')}
          className="v-align-center"
          variant="text-destructive"
          onClick={this.requestCancelJob}
        />
      );
    }
    return null;
  }

  getShareBtn() {
    const { t, job } = this.props;
    return job?.status === CONSTANTS.STATUS.COMPLETE ? null : (
      <Button
        label={t('Share Installation')}
        className="v-align-center"
        iconCategory="utility"
        iconName="share"
        iconPosition="left"
        onClick={this.openModal}
      />
    );
  }

  actions = () => (
    <PageHeaderControl>
      {this.getCancelBtn()}
      {this.getShareBtn()}
    </PageHeaderControl>
  );

  /** Returns false if _any_ results for the given step
   * have a status of "hide". True otherwise.
   */
  static stepIsVisible = (stepId: string, job: Job) => {
    let visible = true;
    const stepResults = job.results[stepId];
    if (stepResults) {
      for (const result of stepResults) {
        if (result?.status === CONSTANTS.RESULT_STATUS.HIDE) {
          visible = false;
          break;
        }
      }
    }
    return visible;
  };

  render() {
    const {
      t,
      user,
      product,
      productSlug,
      version,
      versionLabel,
      plan,
      planSlug,
      job,
      jobId,
      scratchOrg,
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

    /* istanbul ignore if */
    if (!product || !version || !plan || !job) {
      return <ProductNotFound />;
    }
    const isScratchOrg = Boolean(job.org_id && !job.creator);
    const linkToPlan = routes.plan_detail(
      product.slug,
      getVersionLabel(product, version),
      plan.slug,
    );
    const { canceling } = this.state;
    const steps = plan.steps
      ? plan.steps.filter((step) => JobDetail.stepIsVisible(step.id, job))
      : [];
    return (
      <DocumentTitle
        title={`${t('Installation')} | ${plan.title} | ${product.title} | ${
          window.SITE_NAME
        }`}
      >
        <>
          <Header history={history} jobId={jobId} hideLogin={isScratchOrg} />
          <PageHeader
            product={product}
            version={version}
            plan={plan}
            job={job}
            onRenderActions={this.actions}
          />
          <ShareModal
            isOpen={this.state.modalOpen}
            job={job}
            plan={plan}
            scratchOrg={isScratchOrg ? scratchOrg : null}
            toggleModal={this.toggleModal}
            updateJob={doUpdateJob}
          />
          <BodyContainer>
            <Toasts job={job} label="Installation" />
            <Intro
              averageDuration={plan.average_duration}
              isProductionOrg={job.is_production_org}
              results={<JobResults job={job} openModal={this.openModal} />}
              cta={
                <CtaButton
                  job={job}
                  isScratchOrg={isScratchOrg}
                  linkToPlan={linkToPlan}
                  canceling={canceling}
                  preflightRequired={plan.requires_preflight}
                  openModal={this.openModal}
                />
              }
              postMessage={<JobMessage job={job} />}
              backLink={
                job.status === CONSTANTS.STATUS.STARTED ? null : (
                  <BackLink
                    label={t('Install another product')}
                    url={routes.product_list()}
                    className="slds-p-top_small"
                  />
                )
              }
            />
            <UserInfo job={job} scratchOrg={isScratchOrg ? scratchOrg : null} />
            <ProgressBar job={job} />
            {steps?.length ? (
              <StepsTable steps={steps} plan={plan} job={job} />
            ) : null}
          </BodyContainer>
        </>
      </DocumentTitle>
    );
  }
}

const WrappedJobDetail = connector(withRouter(withTranslation()(JobDetail)));

export default WrappedJobDetail;
