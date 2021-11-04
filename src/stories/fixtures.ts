import { CONSTANTS } from '@/js/store/plans/reducer';
import { SCRATCH_ORG_STATUSES, SUPPORTED_ORGS } from '@/js/utils/constants';

export const sampleStep1 = {
  id: 'samplestep1',
  name: 'Install SFDO Base 1.0',
  kind: 'Managed Package',
  kind_icon: 'archive',
  is_required: true,
  is_recommended: true,
  description: 'More information about this step.',
};

export const sampleStep2 = {
  id: 'samplestep2',
  name: 'Install Outbound Funds (Core) 1.24',
  kind: 'Managed Package',
  kind_icon: 'archive',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStep3 = {
  id: 'samplestep3',
  name: 'EDA - Course Connection Record Types',
  kind: 'Metadata',
  kind_icon: 'package',
  is_required: false,
  is_recommended: true,
  description: '',
};

export const sampleStep4 = {
  id: 'samplestep4',
  name: 'Install Admissions Connect 1.14',
  kind: 'Managed Package',
  kind_icon: 'archive',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStep5 = {
  id: 'samplestep5',
  name: 'Admissions Connect - Unmanaged Components',
  kind: 'Metadata',
  kind_icon: 'package',
  is_required: true,
  is_recommended: true,
  description: '',
};

export const sampleStepResult1 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  logs: '<span style="color: #25bc24">2021-09-17 13:28:36</span>  Options: \n<span style="color: #25bc24">2021-09-17 13:29:53</span> name: sfdobase \n<span style="color: #25bc24">2021-09-17 13:29:53</span> namespace: sfdobase \n<span style="color: #25bc24">2021-09-17 13:29:53</span> version: 1.0 \n<span style="color: #25bc24">2021-09-17 13:29:54</span> security_type: FULL \n<span style="color: #25bc24">2021-09-17 13:29:56</span> Org info updated, writing to keychain \n<span style="color: #25bc24">2021-09-17 13:29:56</span> Beginning task: InstallPackageVersion \n<span style="color: #25bc24">2021-09-17 13:30:08</span> sfdobase 1.0 or a newer version is already installed; skipping.',
};

export const sampleStepResult2 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  logs: '<span style="color: #25bc24">2021-09-17 13:30:09</span> <span style="color: #adad27">The activateRSS option is deprecated. Please use activate_remote_site_settings.</span> \n<span style="color: #25bc24">2021-09-17 13:30:09</span> Options: \n<span style="color: #25bc24">2021-09-17 13:30:09</span> name: Outbound Funds (Core) \n<span style="color: #25bc24">2021-09-17 13:30:09</span> namespace: outfunds \n<span style="color: #25bc24">2021-09-17 13:30:09</span> version: 1.24 \n<span style="color: #25bc24">2021-09-17 13:30:09</span> security_type: FULL \n<span style="color: #25bc24">2021-09-17 13:30:09</span> activate_remote_site_settings: True \n<span style="color: #25bc24">2021-09-17 13:30:11</span> Org info updated, writing to keychain \n<span style="color: #25bc24">2021-09-17 13:30:11</span> Beginning task: InstallPackageVersion \n<span style="color: #25bc24">2021-09-17 13:30:11</span> \n<span style="color: #25bc24">2021-09-17 13:30:21</span> Installing Outbound Funds (Core) 1.24 \n<span style="color: #25bc24">2021-09-17 13:30:21</span> Pending \n<span style="color: #25bc24">2021-09-17 13:30:22</span> [Pending]: next check in 1 seconds \n<span style="color: #25bc24">2021-09-17 13:30:24</span> [Pending]: next check in 1 seconds \n<span style="color: #25bc24">2021-09-17 13:30:25</span> [Pending]: next check in 2 seconds \n<span style="color: #25bc24">2021-09-17 13:30:27</span> [Done] \n<span style="color: #25bc24">2021-09-17 13:32:47</span> [Success]: Succeeded',
};

export const sampleStepResult3 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  logs: '<span style="color: #25bc24">2021-09-17 13:33:13</span> Options: \n<span style="color: #25bc24">2021-09-17 13:34:02</span> dependencies:\n<span style="color: #25bc24">2021-09-17 13:34:10</span>   packages_only: False \n<span style="color: #25bc24">2021-09-17 13:35:01</span> Org info updated, writing to keychain \n<span style="color: #25bc24">2021-09-17 13:35:40</span> Beginning task: UpdateDependencies\n<span style="color: #25bc24">2021-09-17 13:35:41</span> Resolving dependencies... \n<span style="color: #25bc24">2021-09-17 13:35:50</span> Collected dependencies:\n<span style="color: #25bc24">2021-09-17 13:35:51</span> Contacts &amp; Organizations 3.19 \n<span style="color: #25bc24">2021-09-17 13:35:52</span> Contacts &amp; Organizations 3.19 or a newer version is already installed; skipping.',
};

export const sampleStepResult4 = {
  status: CONSTANTS.RESULT_STATUS.OK,
  logs: '<span style="color: #25bc24">2021-09-17 13:36:01</span> Options: \n<span style="color: #25bc24">2021-09-17 13:01:13</span> dependencies:\n <span style="color: #25bc24">2021-09-17 13:36:02</span>   - {\'ref\': \'2fe07cc960625f3a914b55c91da7e05a9dd66624\', \'github\': \'https://github.com/SalesforceFoundation/NPSP\', \'subfolder\': \'unpackaged/post/first\', \'unmanaged\': False, \'namespace_inject\': \'npsp\'} \n <span style="color: #25bc24">2021-09-17 13:36:02</span> packages_only: False \n<span style="color: #25bc24">2021-09-17 13:36:03</span>   security_type: FULL \n<span style="color: #25bc24">2021-09-17 13:36:03</span> Org info updated, writing to keychain\n<span style="color: #25bc24">2021-09-17 13:36:05</span> Beginning task: UpdateDependencies \n<span style="color: #25bc24">2021-09-17 13:36:05</span> Resolving dependencies... \n<span style="color: #25bc24">2021-09-17 13:36:05</span> Collected dependencies: \n<span style="color: #25bc24">2021-09-17 13:36:05</span> Mail &amp; Databases 3.19  \n<span style="color: #25bc24">2021-09-17 13:36:05</span>  [Success]: Succeeded',
};

export const sampleFailedResult = {
  status: CONSTANTS.RESULT_STATUS.ERROR,
  message: 'This is an error message. It failed to install.',
  logs: '<span style="color: #25bc24">2021-09-17 13:30:09</span> Options: \n<span style="color: #25bc24">2021-09-17 13:30:09</span> name: Admissions Connect - Unmanaged Components \n<span style="color: #25bc24">2021-09-17 13:30:09</span> namespace: admissions_connect \n<span style="color: #25bc24">2021-09-17 13:30:09</span> version: 1.24 \n<span style="color: #25bc24">2021-09-17 13:30:09</span> security_type: FULL \n<span style="color: #25bc24">2021-09-17 13:30:09</span> activate_remote_site_settings: True \n<span style="color: #25bc24">2021-09-17 13:30:11</span> Org info updated, writing to keychain \n<span style="color: #25bc24">2021-09-17 13:30:11</span> Beginning task: InstallPackageVersion \n<span style="color: #25bc24">2021-09-17 13:30:21</span> Installing Admissions Connect - Unmanaged Components \n<span style="color: #25bc24">2021-09-17 13:30:21</span> Pending ',
};

export const samplePlan1 = {
  id: 'plan1',
  slug: 'plan_slug',
  old_slugs: ['123', 'sample-slug'],
  title: 'My Plan',
  preflight_message: '<p>This will install Test Module in your org.</p>',
  steps: [sampleStep1, sampleStep2, sampleStep3, sampleStep4, sampleStep5],
  is_listed: true,
  is_allowed: true,
  not_allowed_instructions: null,
  average_duration: null,
  requires_preflight: true,
  order_key: 2,
  supported_orgs: SUPPORTED_ORGS.Persistent,
  scratch_org_duration: 30,
};

export const samplePlan2 = {
  id: 'plan1',
  slug: 'plan_slug',
  old_slugs: ['123', 'sample-slug'],
  title: 'My Plan',
  preflight_message: '<p>This will install Test Module in your org.</p>',
  steps: [sampleStep1, sampleStep2, sampleStep3, sampleStep4, sampleStep5],
  is_listed: true,
  is_allowed: true,
  not_allowed_instructions: null,
  average_duration: null,
  requires_preflight: true,
  order_key: 2,
  supported_orgs: SUPPORTED_ORGS.Scratch,
  scratch_org_duration: 30,
};

export const sampleJob1 = {
  id: 'job1',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j1',
  org_id: 'org1',
  creator: {
    username: 'dev@dev.org',
    is_staff: true,
  },
  plan: samplePlan1.id,
  status: CONSTANTS.STATUS.STARTED,
  steps: [sampleStep1.id, sampleStep2.id, sampleStep4.id, sampleStep5.id],
  results: {
    samplestep1: [sampleStepResult1],
    samplestep2: [sampleStepResult2],
    samplestep4: [{ logs: sampleStepResult4.logs }],
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
  plan: 'plan1',
  status: CONSTANTS.STATUS.COMPLETE,
  steps: [sampleStep1.id, sampleStep2.id, sampleStep4.id, sampleStep5.id],
  results: {
    samplestep1: [sampleStepResult1],
    samplestep2: [sampleStepResult2],
    samplestep4: [sampleStepResult4],
    samplestep5: [
      {
        ...sampleFailedResult,
        status: CONSTANTS.RESULT_STATUS.OK,
      },
    ],
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
  plan: 'plan1',
  status: CONSTANTS.STATUS.FAILED,
  steps: [sampleStep1.id, sampleStep2.id, sampleStep4.id, sampleStep5.id],
  results: {
    samplestep1: [sampleStepResult1],
    samplestep2: [sampleStepResult2],
    samplestep4: [sampleFailedResult],
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

export const sampleJob4 = {
  id: 'job4',
  edited_at: '2021-02-01T19:47:49Z',
  job_id: 'j4',
  org_id: 'org1',
  creator: {
    username: 'user-name',
    is_staff: true,
  },
  plan: 'plan1',
  status: CONSTANTS.STATUS.CANCELED,
  steps: [sampleStep1.id, sampleStep2.id, sampleStep4.id, sampleStep5.id],
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

export const samplePreflight1 = {
  id: 'pf-1',
  edited_at: '',
  user: 'XlZVyyl',
  plan: samplePlan1.id,
  status: CONSTANTS.STATUS.COMPLETE,
  results: {},
  is_valid: true,
  error_count: 0,
  warning_count: 0,
  is_ready: true,
};

export const samplePreflight2 = {
  id: 'pf-2',
  edited_at: '',
  user: 'XlZVyyl',
  plan: samplePlan1.id,
  status: CONSTANTS.STATUS.FAILED,
  results: {
    samplestep1: [{ status: CONSTANTS.RESULT_STATUS.SKIP }],
    samplestep2: [
      {
        status: CONSTANTS.RESULT_STATUS.OPTIONAL,
        message: 'Pre-install validation marked this step as optional',
      },
    ],
    samplestep4: [
      {
        status: CONSTANTS.RESULT_STATUS.WARN,
        message: 'This step has a warning',
      },
    ],
    samplestep5: [
      {
        status: CONSTANTS.RESULT_STATUS.ERROR,
        message: 'This step has an error',
      },
      {
        status: CONSTANTS.RESULT_STATUS.ERROR,
        message: 'This step has another error too',
      },
    ],
  },
  is_valid: true,
  error_count: 1,
  warning_count: 1,
  is_ready: false,
};

export const sampleUser1 = {
  id: 'user-1',
  username: 'dev@dev.com',
  email: 'dev@dev.com',
  is_staff: false,
  valid_token_for: '99D09999999FQMlEAO',
  org_name: 'Sample Org',
  org_type: 'Developer Edition',
  is_production_org: false,
};

export const sampleUser2 = {
  id: 'user-2',
  username: 'dev2@dev.com',
  email: 'dev2@dev.com',
  is_staff: false,
  valid_token_for: null,
  org_name: 'Sample Org',
  org_type: 'Developer Edition',
  is_production_org: false,
};

export const sampleScratchOrg1 = {
  id: 'v96dzZr',
  plan: 'samplePlan1',
  status: SCRATCH_ORG_STATUSES.started,
  org_id: 'v96dzZr',
  enqueued_at: '2021-10-28T13:34:07.780075Z',
  created_at: '2021-10-28T13:34:07.780075Z',
  edited_at: '2021-10-28T13:34:07.780075Z',
  uuid: '5746',
  expires_at: '2021-11-27T13:32:17.081504Z',
};
