import { ThunkResult } from '@/js/store';
import { Job } from '@/js/store/jobs/reducer';
import { StepResult } from '@/js/store/plans/reducer';
import apiFetch, { addUrlParams } from '@/js/utils/api';
import { LATEST_VERSION } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

export type JobData = {
  plan: string;
  steps: string[];
  results: {
    [key: string]: StepResult[];
  };
};

type FetchJobStarted = {
  type: 'FETCH_JOB_STARTED';
  payload: string;
};
type FetchJobSucceeded = {
  type: 'FETCH_JOB_SUCCEEDED';
  payload: { id: string; job: Job };
};
type FetchJobFailed = {
  type: 'FETCH_JOB_FAILED';
  payload: string;
};
type JobRequested = { type: 'JOB_REQUESTED'; payload: JobData };
export type JobStarted = {
  type: 'JOB_STARTED';
  payload: Job;
};
type JobRejected = { type: 'JOB_REJECTED'; payload: JobData };
export type JobStepCompleted = {
  type: 'JOB_STEP_COMPLETED';
  payload: Job;
};
export type JobCompleted = { type: 'JOB_COMPLETED'; payload: Job };
export type JobFailed = { type: 'JOB_FAILED'; payload: Job };
type JobUpdateRequested = { type: 'JOB_UPDATE_REQUESTED'; payload: Job };
export type JobUpdated = { type: 'JOB_UPDATED'; payload: Job };
type JobUpdateRejected = { type: 'JOB_UPDATE_REJECTED'; payload: Job };
type JobCancelRequested = {
  type: 'JOB_CANCEL_REQUESTED';
  payload: string;
};
type JobCancelAccepted = { type: 'JOB_CANCEL_ACCEPTED'; payload: string };
type JobCancelRejected = {
  type: 'JOB_CANCEL_REJECTED';
  payload: string;
};
export type JobCanceled = { type: 'JOB_CANCELED'; payload: Job };
export type JobsAction =
  | FetchJobStarted
  | FetchJobSucceeded
  | FetchJobFailed
  | JobRequested
  | JobStarted
  | JobRejected
  | JobStepCompleted
  | JobCompleted
  | JobFailed
  | JobUpdateRequested
  | JobUpdated
  | JobUpdateRejected
  | JobCancelRequested
  | JobCancelAccepted
  | JobCancelRejected
  | JobCanceled;

export const fetchJob =
  ({
    jobId,
    productSlug,
    versionLabel,
    planSlug,
  }: {
    jobId: string;
    productSlug: string;
    versionLabel: string;
    planSlug: string;
  }): ThunkResult<Promise<FetchJobSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'FETCH_JOB_STARTED' as const, payload: jobId });
    const url = window.api_urls.job_detail(jobId);
    const params = {
      plan__plan_template__planslug__slug: planSlug,
      plan__version__label: versionLabel,
      plan__version__product__productslug__slug: productSlug,
    };
    try {
      const response = await apiFetch(addUrlParams(url, params), dispatch);
      if (response && window.socket) {
        window.socket.subscribe({
          model: 'job',
          id: response.id,
        });
      }
      return dispatch({
        type: 'FETCH_JOB_SUCCEEDED' as const,
        payload: { id: jobId, job: response },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_JOB_FAILED' as const, payload: jobId });
      throw err;
    }
  };

export const startJob =
  (data: JobData): ThunkResult<Promise<JobStarted>> =>
  async (dispatch) => {
    dispatch({ type: 'JOB_REQUESTED' as const, payload: data });
    const url = window.api_urls.job_list();
    try {
      const response = await apiFetch(url, dispatch, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response) {
        throw new Error('Invalid response received');
      }

      /* istanbul ignore else */
      if (window.socket) {
        window.socket.subscribe({
          model: 'job',
          id: response.id,
        });
      }
      return dispatch({ type: 'JOB_STARTED' as const, payload: response });
    } catch (err) {
      dispatch({ type: 'JOB_REJECTED' as const, payload: data });
      throw err;
    }
  };

export const createJob =
  (payload: Job): ThunkResult<JobStarted> =>
  (dispatch, getState, history) => {
    /* istanbul ignore else */
    if (payload && window.socket) {
      window.socket.subscribe({
        model: 'job',
        id: payload.id,
      });
    }
    const jobStartedAction = dispatch({
      type: 'JOB_STARTED' as const,
      payload,
    });
    const { pathname } = history.location;
    const { product_slug, version_label, version_is_most_recent, plan_slug } =
      payload;
    const matchingRoutes = [
      routes.plan_detail(product_slug, version_label, plan_slug),
    ];
    if (version_is_most_recent) {
      matchingRoutes.push(
        routes.plan_detail(product_slug, LATEST_VERSION, plan_slug),
      );
    }
    /* istanbul ignore else */
    if (matchingRoutes.includes(pathname)) {
      // redirect to job page, if still on plan-detail page
      const url = routes.job_detail(
        product_slug,
        version_label,
        plan_slug,
        payload.id,
      );
      history.push(url);
    }
    return jobStartedAction;
  };

export const completeJobStep = (payload: Job): JobStepCompleted => ({
  type: 'JOB_STEP_COMPLETED' as const,
  payload,
});

export const completeJob = (payload: Job): JobCompleted => ({
  type: 'JOB_COMPLETED' as const,
  payload,
});

export const failJob = (payload: Job): JobFailed => ({
  type: 'JOB_FAILED' as const,
  payload,
});

export const updateJob =
  (payload: {
    readonly id: string;

    [key: string]: unknown;
  }): ThunkResult<Promise<JobUpdated>> =>
  async (dispatch) => {
    const { id } = payload;
    dispatch({ type: 'JOB_UPDATE_REQUESTED' as const, payload });
    const url = window.api_urls.job_detail(id);
    try {
      const response = await apiFetch(url, dispatch, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return dispatch({ type: 'JOB_UPDATED' as const, payload: response });
    } catch (err) {
      dispatch({ type: 'JOB_UPDATE_REJECTED' as const, payload });
      throw err;
    }
  };

export const requestCancelJob =
  (id: string): ThunkResult<Promise<JobCancelAccepted>> =>
  async (dispatch) => {
    dispatch({ type: 'JOB_CANCEL_REQUESTED' as const, payload: id });
    const url = window.api_urls.job_detail(id);
    try {
      await apiFetch(url, dispatch, {
        method: 'DELETE',
      });
      return dispatch({ type: 'JOB_CANCEL_ACCEPTED' as const, payload: id });
    } catch (err) {
      dispatch({ type: 'JOB_CANCEL_REJECTED' as const, payload: id });
      throw err;
    }
  };

export const cancelJob = (payload: Job): JobCanceled => ({
  type: 'JOB_CANCELED' as const,
  payload,
});
