import { JobsAction } from '@/store/jobs/actions';
import { PlanResults } from '@/store/plans/reducer';
import { LogoutAction } from '@/store/user/actions';

export type Job = {
  id: string;
  edited_at: string;
  job_id: string;
  org_id: string | null;
  creator: {
    username: string;
    is_staff: boolean;
  } | null;
  plan: string;
  status: 'started' | 'complete' | 'failed' | 'canceled';
  steps: string[];
  results: PlanResults;
  org_name: string | null;
  org_type: string | null;
  is_production_org: boolean;
  product_slug: string;
  version_label: string;
  plan_slug: string;
  instance_url: string | null;
  error_count: number;
  warning_count: number;
  is_public: boolean;
  user_can_edit: boolean;
  message: string;
  error_message: string | null;
};
export type JobsState = {
  [key: string]: Job;
};

const reducer = (
  jobs: JobsState = {},
  action: JobsAction | LogoutAction,
): JobsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_JOB_SUCCEEDED': {
      const { id, job } = action.payload;
      return { ...jobs, [id]: job };
    }
    case 'JOB_STARTED':
    case 'JOB_COMPLETED':
    case 'JOB_FAILED':
    case 'JOB_CANCELED':
    case 'JOB_UPDATED':
    case 'JOB_STEP_COMPLETED': {
      const job = action.payload;
      const existingJob = jobs[job.id];
      if (!existingJob || job.edited_at > existingJob.edited_at) {
        return { ...jobs, [job.id]: job };
      }
      return jobs;
    }
  }
  return jobs;
};

export default reducer;
