import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import CtaButton from 'components/plans/ctaButton';

const defaultPlan = {
  id: 'plan-1',
  slug: 'my-plan',
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
  ],
};

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
  const setup = options => {
    const defaults = {
      plan: defaultPlan,
      user: { valid_token_for: 'foo' },
      preflight: defaultPreflight,
      preventAction: false,
    };
    const opts = { ...defaults, ...options };
    const { getByText, getByLabelText, container } = render(
      <CtaButton
        history={opts.history}
        user={opts.user}
        productSlug="product"
        versionLabel="version"
        plan={opts.plan}
        preflight={opts.preflight}
        selectedSteps={new Set(['step-1'])}
        preventAction={opts.preventAction}
        doStartPreflight={opts.doStartPreflight}
        doStartJob={opts.doStartJob}
      />,
    );
    return { getByText, getByLabelText, container };
  };

  describe('no user', () => {
    test('renders login btn', () => {
      const { getByText } = setup({ user: null });

      expect(getByText('Log In to Start Pre-Install Validation')).toBeVisible();
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

      expect(getByText('Loading...')).toBeVisible();
    });
  });

  describe('no preflight', () => {
    test('triggers preflight button', () => {
      const doStartPreflight = jest.fn();
      const { getByText } = setup({ preflight: null, doStartPreflight });

      expect(getByText('Pre-Install Validation In Progress...')).toBeVisible();

      expect(doStartPreflight).toHaveBeenCalledWith('plan-1');
    });

    describe('no valid token', () => {
      test('renders login btn', () => {
        const { getByText } = setup({
          preflight: null,
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Start Pre-Install Validation'),
        ).toBeVisible();
      });
    });
  });

  describe('started preflight', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({ preflight: { status: 'started' } });

      expect(getByText('Pre-Install Validation In Progress...')).toBeVisible();
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
          user: { valid_token_for: null },
        });

        expect(getByText('Log In to Install')).toBeVisible();
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
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
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
          user: { valid_token_for: null },
        });

        expect(
          getByText('Log In to Re-Run Pre-Install Validation'),
        ).toBeVisible();
      });
    });
  });

  describe('unknown preflight status', () => {
    test('renders nothing', () => {
      const { container } = setup({
        preflight: { status: 'foo', is_valid: false },
      });

      expect(container.children).toHaveLength(0);
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

      expect(getByText('Install')).toBeVisible();
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

  describe('start-install (with warnings) click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = setup({
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
      fireEvent.click(getByText('Install'));

      expect(getByText('Potential Issues')).toBeVisible();
      expect(getByText('This is a warning.')).toBeVisible();
      expect(
        getByLabelText('I understand these warnings', { exact: false }),
      ).toBeVisible();
    });
  });

  describe('start-install click', () => {
    test('calls doStartJob with plan id and steps', () => {
      const jobStarted = Promise.resolve({});
      const doStartJob = jest.fn(() => jobStarted);
      const history = { push: jest.fn() };
      const { getByText } = setup({ doStartJob, history });
      fireEvent.click(getByText('Install'));

      expect.assertions(2);
      expect(doStartJob).toHaveBeenCalledWith({
        plan: 'plan-1',
        steps: ['step-1'],
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
        const { getByText } = setup({ doStartJob, history });
        fireEvent.click(getByText('Install'));

        expect.assertions(2);
        expect(doStartJob).toHaveBeenCalledWith({
          plan: 'plan-1',
          steps: ['step-1'],
        });
        return jobStarted.then(() => {
          expect(history.push).toHaveBeenCalledWith(
            '/products/product/version/my-plan/jobs/job-1',
          );
        });
      });
    });
  });
});
