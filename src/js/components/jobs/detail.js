// @flow

import * as React from 'react';
import Card from '@salesforce/design-system-react/components/card';
import DocumentTitle from 'react-document-title';
import Icon from '@salesforce/design-system-react/components/icon';
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
import { shouldFetchVersion, gatekeeper } from 'products/utils';

import Header from 'components/plans/header';
import BodyContainer from 'components/bodyContainer';
import ProductNotFound from 'components/products/product404';
import ProgressBar from 'components/jobs/progressBar';
import StepsTable from 'components/plans/stepsTable';
import { ActionBtn, LabelWithSpinner } from 'components/plans/ctaButton';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type { JobsState, Job as JobType } from 'jobs/reducer';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

export type SelectedSteps = Set<string>;
type Props = {
  ...InitialProps,
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
    if (
      product !== prevProps.product ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel
    ) {
      this.fetchVersionIfMissing();
    }
    if (job !== prevProps.job || jobId !== prevProps.jobId) {
      this.fetchJobIfMissing();
    }
  }

  render(): React.Node {
    const { product, version, versionLabel, plan, job, jobId } = this.props;
    const blocked = gatekeeper({
      product,
      version,
      versionLabel,
      plan,
      job,
      jobId,
    });
    if (blocked !== false) {
      return blocked;
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
            <div
              className="slds-p-around_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2"
            >
              <div className="slds-text-longform">
                <h3 className="slds-text-heading_small">{plan.title}</h3>
              </div>
              <ActionBtn
                label={<LabelWithSpinner label="Installation In Progress..." />}
                disabled
              />
            </div>
            <div
              className="slds-p-around_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2"
            >
              {(job.creator && job.creator.username) ||
              job.org_name ||
              job.org_type ? (
                <Card
                  bodyClassName="slds-card__body_inner"
                  heading=""
                  icon={<Icon category="utility" name="user" />}
                >
                  <ul>
                    {job.creator && job.creator.username ? (
                      <li>
                        <strong>User:</strong> {job.creator.username}
                      </li>
                    ) : null}
                    {job.org_name ? (
                      <li>
                        <strong>Org:</strong> {job.org_name}
                      </li>
                    ) : null}
                    {job.org_type ? (
                      <li>
                        <strong>Type:</strong> {job.org_type}
                      </li>
                    ) : null}
                  </ul>
                </Card>
              ) : null}
            </div>
            <div
              className="slds-p-around_medium
                  slds-size_1-of-1"
            >
              <ProgressBar job={job} />
            </div>
            {plan.steps.length ? (
              <div
                className="slds-p-around_medium
                  slds-size_1-of-1"
              >
                <StepsTable plan={plan} job={job} />
              </div>
            ) : null}
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
