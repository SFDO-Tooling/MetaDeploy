import { SCRATCH_ORG_STATUSES } from '@/utils/constants';

export const sampleJob1 = {
  id: 'job1',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j1',
  org_id: 'org1',
  creator: {
    username: 'user-name',
    is_staff: true,
  },
  plan: 'plan1',
  status: SCRATCH_ORG_STATUSES.started,
  steps: ['gYBP3dj', 'gYBP3dj', 'SgYBP3dj'],
  results: {},
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_production_org: false,
  product_slug: 'some-product',
  version_label: '1.2',
  plan_slug: 'full-instal',
  instance_url: 'https://sample.salesforce.org/',
  error_count: 0,
  warning_count: 0,
  is_public: false,
  user_can_edit: true,
  message: '<p>Success! You installed it.</p>',
  error_message: '',
};
