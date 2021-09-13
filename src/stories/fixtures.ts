import { CONSTANTS } from '@/js/store/plans/reducer';
import { SUPPORTED_ORGS } from '@/js/utils/constants';

export const sampleStep1 = {
  id: 'samplestep1',
  name: 'Install sfdobase 1.0',
  kind: 'Managed Package',
  kind_icon: 'archive',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStep2 = {
  id: 'samplestep2',
  name: 'Install AnyPackage 1.0',
  kind: 'Managed Package',
  kind_icon: 'package',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStep3 = {
  id: 'samplestep3',
  name: 'Install NCSC 1.0',
  kind: 'Managed Package',
  kind_icon: 'package',
  is_required: false,
  is_recommended: true,
  description: '',
};

export const sampleStep4 = {
  id: 'samplestep4',
  name: 'Install ABC 2.0',
  kind: 'Managed Package',
  kind_icon: 'archive',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStepResult1 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  message: 'Here is a message',
  logs: '<span style="color: #25bc24">2021-09-09 11:11:36</span> Options:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>   dependencies:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>',
};

export const sampleStepResult2 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  message: 'Here is a message',
  logs: '<span style="color: #25bc24">2021-09-09 11:11:36</span> Options:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>   dependencies:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>',
};

export const sampleStepResult3 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  message: 'Here is a message',
  logs: '<span style="color: #25bc24">2021-09-09 11:11:36</span> Options:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>   dependencies:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>',
};

export const sampleStepResult4 = {
  status: CONSTANTS.RESULT_STATUS.OPTIONAL,
  message: 'Here is a message',
  logs: '<span style="color: #25bc24">2021-09-09 11:11:36</span> Options:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>   dependencies:\n<span style="color: #25bc24">2021-09-09 11:11:36</span>',
};

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
  status: CONSTANTS.STATUS.STARTED,
  steps: [sampleStep1.id, sampleStep2.id],
  results: {
    samplestep1: [sampleStepResult1],
    samplestep2: [sampleStepResult2],
  },
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_production_org: false,
  product_slug: 'some-product',
  version_label: '1.2',
  version_is_most_recent: true,
  plan_slug: 'my-plan',
  instance_url: 'https://sample.salesforce.org/',
  error_count: 0,
  warning_count: 0,
  is_public: false,
  user_can_edit: true,
  message: '<p>Success! You installed it.</p>',
  error_message: '',
};

export const sampleJob2 = {
  id: 'job2',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j12',
  org_id: 'org1',
  creator: {
    username: 'user-name',
    is_staff: true,
  },
  plan: 'plan2',
  status: CONSTANTS.STATUS.COMPLETE,
  steps: [sampleStep3.id, sampleStep4.id],
  results: {
    samplestep3: [sampleStepResult3],
    samplestep4: [sampleStepResult4],
  },
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_production_org: false,
  product_slug: 'some-product',
  version_label: '1.2',
  version_is_most_recent: true,
  plan_slug: 'my-plan',
  instance_url: 'https://sample.salesforce.org/',
  error_count: 0,
  warning_count: 0,
  is_public: true,
  user_can_edit: true,
  message: '<p>Success! You installed it.</p>',
  error_message: 'There is an error',
};

export const sampleJob3 = {
  id: 'job3',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j3',
  org_id: 'org1',
  creator: {
    username: 'user-name',
    is_staff: true,
  },
  plan: 'plan2',
  status: CONSTANTS.STATUS.FAILED,
  steps: ['gYBP3dj', 'gYBP3dj', 'SgYBP3dj'],
  results: {},
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_production_org: false,
  product_slug: 'some-product',
  version_label: '1.2',
  version_is_most_recent: true,
  plan_slug: 'my-plan',
  instance_url: 'https://sample.salesforce.org/',
  error_count: 0,
  warning_count: 0,
  is_public: false,
  user_can_edit: true,
  message: '<p>Success! You installed it.</p>',
  error_message: '',
};

export const sampleJob4 = {
  id: 'job4',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j4',
  org_id: 'org1',
  creator: {
    username: 'user-name',
    is_staff: true,
  },
  plan: 'plan2',
  status: CONSTANTS.STATUS.CANCELED,
  steps: ['gYBP3dj', 'gYBP3dj', 'SgYBP3dj'],
  results: {},
  org_name: 'OddBird',
  org_type: 'Developer Edition',
  is_production_org: false,
  product_slug: 'some-product',
  version_label: '1.2',
  version_is_most_recent: true,
  plan_slug: 'my-plan',
  instance_url: 'https://sample.salesforce.org/',
  error_count: 0,
  warning_count: 0,
  is_public: false,
  user_can_edit: true,
  message: '<p>Success! You installed it.</p>',
  error_message: '',
};

export const samplePlan1 = {
  id: 'my-plan',
  slug: 'plan_slug',
  old_slugs: ['123', 'sample-slug'],
  title: 'My Plan',
  preflight_message: '<p>This will install Test Module in your org.</p>',
  steps: [sampleStep1, sampleStep2],
  is_listed: true,
  is_allowed: true,
  not_allowed_instructions: null,
  average_duration: null,
  requires_preflight: false,
  order_key: 2,
  supported_orgs: SUPPORTED_ORGS.Persistent,
  scratch_org_duration: 30,
};
