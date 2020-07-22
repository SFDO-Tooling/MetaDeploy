import { createSelector } from 'reselect';

import type { InitialProps } from '@/components/utils';
import type { AppState } from '@/store';
import type { Job as JobType, JobsState } from '@/store/jobs/reducer';
import type { Plan as PlanType } from '@/store/plans/reducer';
import { selectPlan } from '@/store/plans/selectors';

export const selectJobsState = (appState: AppState): JobsState => appState.jobs;

export const selectJobId = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.jobId;

export const selectJob: (AppState, InitialProps) => ?JobType = createSelector(
  [selectJobsState, selectJobId, selectPlan],
  (jobs: JobsState, jobId: ?string, plan: PlanType | null): ?JobType => {
    if (!jobId) {
      return undefined;
    }
    // A `null` job means we already fetched and no prior job exists
    // An `undefined` job means we don't know whether a job exists
    const job = jobs[jobId];
    // Only return job if it belongs to the requested plan...
    if (!job || (plan && job.plan === plan.id)) {
      return job;
    }
    return null;
  },
);
