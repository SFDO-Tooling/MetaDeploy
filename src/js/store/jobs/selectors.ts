import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/js/store';
import { Job, JobsState } from '@/js/store/jobs/reducer';
import { Plan } from '@/js/store/plans/reducer';
import { selectPlan } from '@/js/store/plans/selectors';

export const selectJobsState = (appState: AppState): JobsState => appState.jobs;

export const selectJobId = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ jobId?: string }>,
): string | null | undefined => params.jobId;

export const selectJob = createSelector(
  [selectJobsState, selectJobId, selectPlan],
  (
    jobs: JobsState,
    jobId: string | null | undefined,
    plan: Plan | null,
  ): Job | null | undefined => {
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
