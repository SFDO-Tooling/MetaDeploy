// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { fetchJob } from 'jobs/actions';
import { fetchVersion } from 'products/actions';
import { selectPlan } from 'components/plans/detail';
import {
  selectProduct,
  selectVersion,
  selectVersionLabel,
} from 'components/products/detail';
import { selectUserState } from 'components/header';
import { shouldFetchVersion, getLoadingOrNotFound } from 'products/utils';

import BodyContainer from 'components/bodyContainer';
import CtaButton from 'components/jobs/ctaButton';
import Header from 'components/plans/header';
import Intro from 'components/plans/intro';
import JobResults from 'components/plans/jobResults';
import ProductNotFound from 'components/products/product404';
import ProgressBar from 'components/jobs/progressBar';
import StepsTable from 'components/plans/stepsTable';
import Toasts from 'components/plans/toasts';
import UserInfo from 'components/jobs/userInfo';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type { JobsState, Job as JobType } from 'jobs/reducer';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';
import type { User as UserType } from 'accounts/reducer';

type Props = {
  ...InitialProps,
  user: UserType,
  product: ProductType | null,
  version: VersionType | null,
  versionLabel: ?string,
  plan: PlanType | null,
  job: ?JobType,
  jobId: ?string,
  doFetchVersion: typeof fetchVersion,
  doFetchJob: typeof fetchJob,
};

class JobDetail extends React.Component<Props> {
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

  fetchJobIfMissing() {
    const { job, jobId, doFetchJob } = this.props;
    if (job === undefined && jobId) {
      // Fetch job from API
      doFetchJob(jobId);
    }
  }

  componentDidMount() {
    this.fetchVersionIfMissing();
    this.fetchJobIfMissing();
  }

  componentDidUpdate(prevProps) {
    const { product, version, versionLabel, job, jobId } = this.props;
    const versionChanged =
      product !== prevProps.product ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel;
    const jobChanged = job !== prevProps.job || jobId !== prevProps.jobId;
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
    if (jobChanged) {
      this.fetchJobIfMissing();
    }
  }

  render(): React.Node {
    const {
      user,
      product,
      version,
      versionLabel,
      plan,
      job,
      jobId,
    } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      version,
      versionLabel,
      plan,
      job,
      jobId,
      user,
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
    return (
      <DocumentTitle
        title={`Installation | ${plan.title} | ${product.title} | MetaDeploy`}
      >
        <>
          <Header product={product} version={version} plan={plan} />
          <BodyContainer>
            <Toasts model={job} label="Installation" />
            <Intro
              product={product}
              version={version}
              plan={plan}
              results={<JobResults job={job} label="Installation" />}
              cta={<CtaButton job={job} />}
            />
            <UserInfo job={job} />
            <ProgressBar job={job} />
            {plan.steps.length ? <StepsTable plan={plan} job={job} /> : null}
          </BodyContainer>
        </>
      </DocumentTitle>
    );
  }
}

const selectJobsState = (appState: AppState): JobsState => appState.jobs;

const selectJobId = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.jobId;

const selectJob = createSelector(
  [selectJobsState, selectJobId],
  (jobs: JobsState, jobId: ?string): ?JobType => {
    if (!jobId) {
      return undefined;
    }
    // A `null` job means we already fetched and no prior job exists
    // An `undefined` job means we don't know whether a job exists
    return jobs[jobId];
  },
);

const select = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
  job: selectJob(appState, props),
  jobId: selectJobId(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
  doFetchJob: fetchJob,
};

const WrappedJobDetail: React.ComponentType<InitialProps> = connect(
  select,
  actions,
)(JobDetail);

export default WrappedJobDetail;
