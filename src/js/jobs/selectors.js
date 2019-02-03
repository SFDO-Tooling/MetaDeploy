// @flow

import { createSelector } from 'reselect';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type { Job as JobType, JobsState } from 'jobs/reducer';

export const selectJobsState = (appState: AppState): JobsState => appState.jobs;

export const selectJobId = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.jobId;

export const selectJob: (AppState, InitialProps) => ?JobType = createSelector(
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
