import { fireEvent } from '@testing-library/react';
import React from 'react';

import CtaButton from '@/js/components/plans/ctaButton';
import { getUrlParam, removeUrlParam } from '@/js/utils/api';
import { SCRATCH_ORG_STATUSES, SUPPORTED_ORGS } from '@/js/utils/constants';

import { render, rerenderWithI18n } from './../../utils';

jest.mock('@/js/utils/api');

afterEach(() => {
  getUrlParam.mockReset();
  removeUrlParam.mockReset();
});

const defaultPlan = {
  id: 'plan-1',
  slug: 'my-plan',
  old_slugs: [],
  title: 'My Plan',
  steps: [
    {
      id: 'step-1',
      name: 'Step 1',
      description: 'This is a step description.',
      kind: 'Metadata',
      kind_icon: 'package',
      is_required: true,
      is_recommended: true,
    },
    {
      id: 'step-2',
      name: 'Step 2',
      description: 'This is another step description.',
      kind: 'Metadata',
      kind_icon: 'package',
      is_required: false,
      is_recommended: false,
    },
  ],
  requires_preflight: true,
  supported_orgs: 'Persistent',
};

const selectedSteps = new Set(['step-1']);

const defaultPreflight = {
  plan: 'plan-1',
  status: 'complete',
  results: {},
  is_valid: true,
  error_count: 0,
  warning_count: 0,
  is_ready: true,
};

describe('<CtaButton />', () => {
  const setup = (options) => {
    const defaults = {
      plan: defaultPlan,
      user: { valid_token_for: 'foo', org_type: 'Developer Edition' },
      preflight: defaultPreflight,
      preventAction: false,
      clickThroughAgreement: null,
      selectedSteps,
      scratchOrg: null,
    };
    const opts = { ...defaults, ...options };
    const renderFn = opts.rerenderFn ? rerenderWithI18n : render;
    return renderFn(
      <CtaButton
        history={opts.history}
        user={opts.user}
        productSlug="product"
        clickThroughAgreement={opts.clickThroughAgreement}
        versionLabel="version"
        plan={opts.plan}
        preflight={opts.preflight}
        selectedSteps={opts.selectedSteps}
        scratchOrg={opts.scratchOrg}
        preventAction={opts.preventAction}
        doStartPreflight={opts.doStartPreflight}
        doStartJob={opts.doStartJob}
        doSpinScratchOrg={opts.doSpinScratchOrg}
        doLogout={opts.doLogout}
      />,
      opts.rerenderFn,
    );
  };

  describe('no user', () => {
    test('renders login btn', () => {
      const { getByText } = setup({ user: null });

      expect(getByText('Log In to Start Pre-Install Validation')).toBeVisible();
    });

    test('renders login btn (supports scratch orgs)', () => {
      const { getByText } = setup({
        user: null,
        plan: { ...defaultPlan, supported_orgs: 'Both' },
      });

      expect(getByText('Log In to Existing Org')).toBeVisible();
    });
  });

  describe('preventAction', () => {
    test('renders disabled btn', () => {
      const { getByText } = setup({ preventAction: true });

      expect(getByText('Install')).toBeVisible();
      expect(getByText('Install')).toBeDisabled();
    });
  });

  describe('unknown preflight', () => {
    test('renders loading btn', () => {
      const { getByText } = setup({ preflight: undefined });

      expect(getByText('Loading…')).toBeVisible();
    });
  });

  describe('no preflight', () => {
    test('renders start-preflight btn', () => {
      const { getByText } = setup({ preflight: null });

      expect(getByText('Start Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: null,
          user: { valid_token_for: null, org_type: 'Developer Edition' },
        });

        expect(
          getByText('Log In to Start Pre-Install Validation'),
        ).toBeVisible();
      });

      test('renders login btn (supports scratch orgs)', () => {
        const { getByText } = setup({
          preflight: null,
          user: { valid_token_for: null, org_type: 'Developer Edition' },
          plan: { ...defaultPlan, supported_orgs: 'Both' },
        });

        expect(getByText('Log In to Existing Org')).toBeVisible();
      });
    });
  });

  describe('started preflight', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({ preflight: { status: 'started' } });

      expect(getByText('Pre-Install Validation In Progress…')).toBeVisible();
    });
  });

  describe('complete preflight, no errors', () => {
    test('renders install btn', () => {
      const { getByText } = setup();

      expect(getByText('Install')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          user: { valid_token_for: null, org_type: 'Developer Edition' },
        });

        expect(getByText('Log In to Install')).toBeVisible();
      });

      test('renders login btn (supports scratch orgs)', () => {
        const { getByText } = setup({
          user: { valid_token_for: null, org_type: 'Developer Edition' },
          plan: { ...defaultPlan, supported_orgs: 'Both' },
        });

        expect(getByText('Log In to Existing Org')).toBeVisible();
      });
    });
  });

  describe('complete preflight, with errors', () => {
    test('renders re-run-preflight btn', () => {
      const { getByText } = setup({
        preflight: { status: 'complete', is_valid: true, error_count: 1 },
      });

      expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: { status: 'complete', is_valid: true, error_count: 1 },
          user: { valid_token_for: null, org_type: 'Developer Edition' },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
      });

      test('renders login btn (supports scratch orgs)', () => {
        const { getByText } = setup({
          preflight: { status: 'complete', is_valid: true, error_count: 1 },
          user: { valid_token_for: null, org_type: 'Developer Edition' },
          plan: { ...defaultPlan, supported_orgs: 'Both' },
        });

        expect(getByText('Log In to Existing Org')).toBeVisible();
      });
    });
  });

  describe('canceled preflight', () => {
    test('renders re-run-preflight btn', () => {
      const { getByText } = setup({
        preflight: { status: 'canceled', is_valid: true, error_count: 0 },
      });

      expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
    });
  });

  describe('failed preflight', () => {
    test('renders re-run-preflight btn', () => {
      const { getByText } = setup({
        preflight: { status: 'failed', is_valid: true, error_count: 0 },
      });

      expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: { status: 'failed', is_valid: true, error_count: 0 },
          user: { valid_token_for: null, org_type: 'Developer Edition' },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
      });

      test('renders login btn (supports scratch orgs)', () => {
        const { getByText } = setup({
          preflight: { status: 'failed', is_valid: true, error_count: 0 },
          user: { valid_token_for: null, org_type: 'Developer Edition' },
          plan: { ...defaultPlan, supported_orgs: 'Both' },
        });

        expect(getByText('Log In to Existing Org')).toBeVisible();
      });
    });
  });

  describe('no preflight required', () => {
    test('renders install btn', () => {
      const { getByText } = setup({
        plan: { ...defaultPlan, requires_preflight: false },
        preflight: undefined,
      });

      expect(getByText('Install')).toBeVisible();
    });

    describe('start-install (with click-through agreement) click', () => {
      test('opens modal', () => {
        const { getByText, getByLabelText } = setup({
          plan: { ...defaultPlan, requires_preflight: false },
          preflight: undefined,
          clickThroughAgreement: '<p>Please and thank you.</p>',
        });
        fireEvent.click(getByText('Install'));

        expect(getByText('Product Terms of Use and Licenses')).toBeVisible();
        expect(getByText('Please and thank you.')).toBeVisible();
        expect(
          getByLabelText('confirm I have read and agree to', { exact: false }),
        ).toBeVisible();
      });
    });
  });

  describe('no plan steps', () => {
    test('renders with empty steps', () => {
      const { getByText } = setup({
        plan: { ...defaultPlan, steps: null },
        preflight: {
          plan: 'plan-1',
          status: 'complete',
          results: {
            'step-1': [{ status: 'warn', message: 'This is a warning.' }],
          },
          is_valid: true,
          error_count: 0,
          warning_count: 1,
          is_ready: true,
        },
      });

      expect(getByText('View Warnings to Continue Installation')).toBeVisible();
    });
  });

  describe('start-preflight click', () => {
    test('calls doStartPreflight with plan id', () => {
      const doStartPreflight = jest.fn();
      const { getByText } = setup({ preflight: null, doStartPreflight });
      fireEvent.click(getByText('Start Pre-Install Validation'));

      expect(doStartPreflight).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('re-run-preflight click', () => {
    test('calls doStartPreflight with plan id', () => {
      const doStartPreflight = jest.fn();
      const { getByText } = setup({
        preflight: { status: 'complete', is_valid: false, error_count: 0 },
        doStartPreflight,
      });
      fireEvent.click(getByText('Re-Run Pre-Install Validation'));

      expect(doStartPreflight).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('start-install (with click-through agreement) click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = setup({
        clickThroughAgreement: '<p>Please and thank you.</p>',
      });
      fireEvent.click(getByText('Install'));

      expect(getByText('Product Terms of Use and Licenses')).toBeVisible();
      expect(getByText('Please and thank you.')).toBeVisible();
      expect(
        getByLabelText('confirm I have read and agree to', { exact: false }),
      ).toBeVisible();
    });
  });

  describe('start-install (with warnings) click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = setup({
        preflight: {
          plan: 'plan-1',
          status: 'complete',
          results: {
            'step-1': [
              { status: 'warn', message: 'This is a warning.' },
              { status: 'warn', message: 'This is another warning.' },
            ],
          },
          is_valid: true,
          error_count: 0,
          warning_count: 1,
          is_ready: true,
        },
      });
      fireEvent.click(getByText('View Warnings to Continue Installation'));

      expect(getByText('Potential Issues')).toBeVisible();
      expect(getByText('This is a warning.')).toBeVisible();
      expect(getByText('This is another warning.')).toBeVisible();
      expect(
        getByLabelText('I understand these warnings', { exact: false }),
      ).toBeVisible();
    });

    test('skips modal if no selected steps have warnings', () => {
      const doStartJob = jest.fn(() => Promise.resolve({}));
      const { getByText, queryByText } = setup({
        preflight: {
          plan: 'plan-1',
          status: 'complete',
          results: {
            'step-2': [{ status: 'warn', message: 'This is a warning.' }],
          },
          is_valid: true,
          error_count: 0,
          warning_count: 1,
          is_ready: true,
        },
        doStartJob,
      });
      fireEvent.click(getByText('Install'));

      expect(queryByText('Potential Issues')).toBeNull();
      expect(doStartJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('start-install click', () => {
    test('calls doStartJob with plan id, steps, and results', () => {
      const jobStarted = Promise.resolve({});
      const doStartJob = jest.fn(() => jobStarted);
      const history = { push: jest.fn() };
      const { getByText } = setup({ doStartJob, history });
      fireEvent.click(getByText('Install'));

      expect.assertions(2);
      expect(doStartJob).toHaveBeenCalledWith({
        plan: 'plan-1',
        steps: ['step-1'],
        results: {},
      });
      return jobStarted.then(() => {
        expect(history.push).not.toHaveBeenCalled();
      });
    });

    describe('start-install success', () => {
      test('redirects to job-detail', () => {
        const jobStarted = Promise.resolve({
          type: 'JOB_STARTED',
          payload: { id: 'job-1' },
        });
        const doStartJob = jest.fn(() => jobStarted);
        const history = { push: jest.fn() };
        const plan = { ...defaultPlan, requires_preflight: false };
        const { getByText } = setup({
          doStartJob,
          history,
          plan,
          preflight: undefined,
        });
        fireEvent.click(getByText('Install'));

        expect.assertions(2);
        expect(doStartJob).toHaveBeenCalledWith({
          plan: 'plan-1',
          steps: ['step-1'],
          results: {},
        });
        return jobStarted.then(() => {
          expect(history.push).toHaveBeenCalledWith(
            '/products/product/version/my-plan/jobs/job-1',
          );
        });
      });
    });
  });

  describe('start-install click (hidden steps)', () => {
    test('calls doStartJob with plan id, steps, and results', () => {
      const jobStarted = Promise.resolve({});
      const doStartJob = jest.fn(() => jobStarted);
      const history = { push: jest.fn() };
      const preflight = {
        ...defaultPreflight,
        results: {
          'step-1': [{ status: 'hide' }, { status: 'hide' }],
        },
      };
      const { getByText } = setup({ doStartJob, history, preflight });
      fireEvent.click(getByText('Install'));

      expect.assertions(1);
      expect(doStartJob).toHaveBeenCalledWith({
        plan: 'plan-1',
        steps: ['step-1'],
        results: {
          'step-1': [{ status: 'hide' }],
        },
      });
    });
  });

  describe('auto-start preflight after login', () => {
    const history = { replace: jest.fn() };

    beforeEach(() => {
      history.replace.mockClear();
      removeUrlParam.mockReturnValue('');
      getUrlParam.mockReturnValue('true');
    });

    test('removes param from search string', () => {
      setup({ preflight: undefined, history });

      expect(removeUrlParam).toHaveBeenCalledWith('start_preflight');
      expect(history.replace).toHaveBeenCalledWith({ search: '' });
    });

    describe('preflight not required', () => {
      test('starts preflight', () => {
        const doStartPreflight = jest.fn();
        setup({
          plan: { ...defaultPlan, requires_preflight: false },
          preflight: undefined,
          doStartPreflight,
          history,
        });

        expect(doStartPreflight).not.toHaveBeenCalled();
      });
    });

    describe('no preflight', () => {
      test('starts preflight', () => {
        const doStartPreflight = jest.fn();
        setup({ preflight: null, doStartPreflight, history });

        expect(doStartPreflight).toHaveBeenCalledWith('plan-1');
      });
    });

    describe('no user', () => {
      test('does not start preflight', () => {
        const doStartPreflight = jest.fn();
        setup({ user: null, doStartPreflight, history });

        expect(doStartPreflight).not.toHaveBeenCalled();
      });
    });

    describe('running preflight', () => {
      test('does not start preflight', () => {
        const doStartPreflight = jest.fn();
        setup({
          preflight: { ...defaultPreflight, status: 'started' },
          doStartPreflight,
          history,
        });

        expect(doStartPreflight).not.toHaveBeenCalled();
      });
    });

    describe('successful preflight', () => {
      test('does not start preflight', () => {
        const doStartPreflight = jest.fn();
        setup({ doStartPreflight, history });

        expect(doStartPreflight).not.toHaveBeenCalled();
      });
    });

    describe('fetching preflight', () => {
      test('starts preflight after fetched', () => {
        const doStartPreflight = jest.fn();
        const { rerender } = setup({
          preflight: undefined,
          doStartPreflight,
          history,
        });

        expect(doStartPreflight).not.toHaveBeenCalled();

        setup({
          rerenderFn: rerender,
          preflight: null,
          doStartPreflight,
          history,
        });

        expect(doStartPreflight).toHaveBeenCalledWith('plan-1');
      });
    });
  });

  describe('can create scratch orgs', () => {
    const scratchOrgPlan = {
      ...defaultPlan,
      supported_orgs: SUPPORTED_ORGS.Scratch,
      requires_preflight: false,
    };
    beforeAll(() => {
      window.GLOBALS.SCRATCH_ORGS_AVAILABLE = true;
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    describe('unknown scratch org', () => {
      test('renders loading btn', () => {
        const { getByText } = setup({
          plan: scratchOrgPlan,
          scratchOrg: undefined,
        });

        expect(getByText('Loading…')).toBeVisible();
      });
    });

    describe('scratch org spinning', () => {
      test('renders loading btn', () => {
        const { getByText } = setup({
          plan: scratchOrgPlan,
          scratchOrg: { status: SCRATCH_ORG_STATUSES.started },
        });

        expect(getByText('Creating Scratch Org…')).toBeVisible();
      });
    });

    describe('no scratch org', () => {
      test('renders logout btn if logged in', () => {
        const { getByText } = setup({
          plan: scratchOrgPlan,
          scratchOrg: null,
        });

        expect(getByText('Log Out to Create Scratch Org')).toBeVisible();
      });

      test('renders create-org btn', () => {
        const { getByText } = setup({
          plan: scratchOrgPlan,
          scratchOrg: null,
          user: null,
        });

        expect(getByText('Create Scratch Org')).toBeVisible();
      });

      describe('create-org click', () => {
        test('opens modal', () => {
          const { getByText, getByLabelText } = setup({
            plan: scratchOrgPlan,
            scratchOrg: null,
            clickThroughAgreement: '<p>Please and thank you.</p>',
            user: null,
          });
          fireEvent.click(getByText('Create Scratch Org'));

          expect(getByText('Product Terms of Use and Licenses')).toBeVisible();
          expect(getByText('Please and thank you.')).toBeVisible();
          expect(
            getByLabelText('I confirm I have read', { exact: false }),
          ).toBeVisible();
          expect(getByText('Confirm & Next')).toBeVisible();
        });

        test('spins up scratch org', () => {
          const doSpinScratchOrg = jest.fn();
          const { getByText, getByLabelText } = setup({
            plan: scratchOrgPlan,
            scratchOrg: null,
            clickThroughAgreement: '<p>Please and thank you.</p>',
            doSpinScratchOrg,
            user: null,
          });
          fireEvent.click(getByText('Create Scratch Org'));
          fireEvent.click(
            getByLabelText('I confirm I have read', { exact: false }),
          );
          fireEvent.click(getByText('Confirm & Next'));
          fireEvent.change(getByLabelText('*Email'), {
            target: { value: 'foo@bar.buz' },
          });
          fireEvent.click(getByText('Confirm'));

          expect(doSpinScratchOrg).toHaveBeenCalledWith(
            'plan-1',
            'foo@bar.buz',
          );
        });

        describe('no click-through-agreement', () => {
          test('opens modal to email page', () => {
            const { getByText, queryByText } = setup({
              plan: scratchOrgPlan,
              scratchOrg: null,
              user: null,
            });
            fireEvent.click(getByText('Create Scratch Org'));

            expect(queryByText('Product Terms of Use and Licenses')).toBeNull();
            expect(getByText('Confirm')).toBeVisible();
          });
        });

        describe('cancel click', () => {
          test('closes modal', () => {
            const { getByText, queryByText } = setup({
              plan: scratchOrgPlan,
              scratchOrg: null,
              user: null,
            });
            fireEvent.click(getByText('Create Scratch Org'));

            expect(getByText('Confirm')).toBeVisible();

            fireEvent.click(getByText('Cancel'));

            expect(queryByText('Confirm')).toBeNull();
          });
        });
      });
    });

    describe('no preflight', () => {
      test('renders start-preflight btn', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          preflight: null,
          user: null,
        });

        expect(getByText('Start Pre-Install Validation')).toBeVisible();
      });
    });

    describe('complete preflight, no errors', () => {
      test('renders install btn', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          user: null,
        });

        expect(getByText('Install')).toBeVisible();
      });

      test('renders logout btn if logged in', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
        });

        expect(getByText('Log Out to Use Scratch Org')).toBeVisible();
      });
    });

    describe('complete preflight, with errors', () => {
      test('renders re-run-preflight btn', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          preflight: { status: 'complete', is_valid: true, error_count: 1 },
          user: null,
        });

        expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
      });
    });

    describe('canceled preflight', () => {
      test('renders re-run-preflight btn', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          preflight: { status: 'canceled', is_valid: true, error_count: 0 },
          user: null,
        });

        expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
      });
    });

    describe('failed preflight', () => {
      test('renders re-run-preflight btn', () => {
        const { getByText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          preflight: { status: 'failed', is_valid: true, error_count: 0 },
          user: null,
        });

        expect(getByText('Re-Run Pre-Install Validation')).toBeVisible();
      });
    });

    describe('no preflight required', () => {
      test('renders install btn', () => {
        const { getByText } = setup({
          plan: scratchOrgPlan,
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          user: null,
        });

        expect(getByText('Install')).toBeVisible();
      });
    });

    describe('start-install (with preflight warnings) click', () => {
      test('opens modal', () => {
        const { getByText, getByLabelText } = setup({
          plan: { ...scratchOrgPlan, requires_preflight: true },
          scratchOrg: { status: SCRATCH_ORG_STATUSES.complete },
          preflight: {
            plan: 'plan-1',
            status: 'complete',
            results: {
              'step-1': [{ status: 'warn', message: 'This is a warning.' }],
            },
            is_valid: true,
            error_count: 0,
            warning_count: 1,
            is_ready: true,
          },
          user: null,
        });
        fireEvent.click(getByText('View Warnings to Continue Installation'));

        expect(getByText('Potential Issues')).toBeVisible();
        expect(getByText('This is a warning.')).toBeVisible();
        expect(
          getByLabelText('I understand these warnings', { exact: false }),
        ).toBeVisible();
      });
    });
  });
});
