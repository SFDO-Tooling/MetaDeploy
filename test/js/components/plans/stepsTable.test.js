import React from 'react';
import { fireEvent, render } from 'react-testing-library';

import StepsTable from 'components/plans/stepsTable';

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
    {
      id: 'step-2',
      name: 'Step 2',
      kind: 'One Time Apex',
      kind_icon: 'apex',
      is_required: true,
      is_recommended: false,
    },
    {
      id: 'step-3',
      name: 'Step 3',
      kind: 'Managed Package',
      kind_icon: 'archive',
      is_required: false,
      is_recommended: true,
    },
    {
      id: 'step-4',
      name: 'Step 4',
      kind: 'Data',
      kind_icon: 'paste',
      is_required: false,
      is_recommended: false,
    },
  ],
};

describe('<StepsTable />', () => {
  const handleStepsChange = jest.fn();

  const setup = options => {
    const defaults = { plan: defaultPlan, user: null };
    const opts = { ...defaults, ...options };
    const { getByText, getAllByText, queryByText, container } = render(
      <StepsTable
        plan={opts.plan}
        user={opts.user}
        preflight={opts.preflight}
        selectedSteps={new Set(['step-1', 'step-2', 'step-3'])}
        job={opts.job}
        handleStepsChange={handleStepsChange}
      />,
    );
    return { getByText, getAllByText, queryByText, container };
  };

  test('renders steps', () => {
    const { getByText } = setup();

    expect(getByText('Step 1')).toBeVisible();
    expect(getByText('Step 2')).toBeVisible();
    expect(getByText('Step 3')).toBeVisible();
    expect(getByText('Step 4')).toBeVisible();
  });

  describe('<NameDataCell>', () => {
    describe('existing preflight', () => {
      test('displays optional message', () => {
        const { getByText } = setup({
          preflight: {
            status: 'complete',
            results: {
              'step-1': {
                status: 'optional',
                message: 'This became optional.',
              },
            },
          },
        });

        expect(getByText('Step 1 — This became optional.')).toBeVisible();
      });

      test('displays error/warning messages', () => {
        const { getByText } = setup({
          preflight: {
            status: 'complete',
            results: {
              'step-1': { status: 'warn', message: 'This warning.' },
              'step-2': { status: 'error', message: 'This other error.' },
            },
          },
        });

        expect(getByText('This warning.')).toBeVisible();
        expect(getByText('This other error.')).toBeVisible();
      });
    });

    test('click expands accordion', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Step 1'));

      expect(getByText('This is a step description.')).toBeVisible();
    });
  });

  describe('<RequiredDataCell>', () => {
    test('becomes optional if preflight result specifies', () => {
      const { queryByText } = setup({
        preflight: {
          status: 'complete',
          results: {
            'step-1': { status: 'optional' },
            'step-2': { status: 'optional' },
          },
        },
      });

      expect(queryByText('Required')).toBeNull();
    });

    test('becomes optional if not included in job', () => {
      const { getAllByText } = setup({
        job: {
          id: 'job-1',
          plan: 'plan-1',
          status: 'started',
          steps: ['step-2'],
          results: {},
        },
      });

      expect(getAllByText('Required')).toHaveLength(1);
    });
  });

  describe('<InstallDataCell>', () => {
    describe('with job', () => {
      test('returns completed, skipped, installing, checkbox', () => {
        const { getByText } = setup({
          job: {
            id: 'job-1',
            plan: 'plan-1',
            status: 'started',
            steps: ['step-1', 'step-2', 'step-4'],
            results: {
              'step-1': { status: 'ok', logs: 'Test log' },
              'step-2': { logs: 'Test log' },
              foo: { status: 'ok', logs: 'Another test log' },
            },
          },
        });

        expect(getByText('Installing…')).toBeVisible();
        expect(getByText('skipped')).toBeVisible();
        expect(getByText('completed')).toBeVisible();
        expect(getByText('waiting to install')).toBeVisible();
      });

      describe('failed', () => {
        test('shows errored step', () => {
          const { getByText, queryByText } = setup({
            job: {
              id: 'job-1',
              plan: 'plan-1',
              status: 'failed',
              steps: ['step-1', 'step-2', 'step-4'],
              results: {
                'step-1': { status: 'ok' },
                'step-2': { status: 'error', message: 'totally failed' },
              },
            },
          });

          expect(getByText('error')).toBeVisible();
          expect(getByText('totally failed')).toBeVisible();
          expect(queryByText('Installing…')).toBeNull();
          expect(queryByText('waiting to install')).toBeNull();
        });
      });
    });

    test('hidden if no user', () => {
      const { container } = setup();
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(0);
    });

    test('hidden if no valid token', () => {
      const { container } = setup({ user: {} });
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(0);
    });

    test('hidden if no ready preflight', () => {
      const { container } = setup({ user: { valid_token_for: 'foo' } });
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(0);
    });

    test('no checkbox if required', () => {
      const { container } = setup({
        user: { valid_token_for: 'foo' },
        preflight: { status: 'complete', is_valid: true, is_ready: true },
      });

      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
        2,
      );
    });

    test('no checkbox if skipped, checkbox if optional', () => {
      const { container, getByText } = setup({
        user: { valid_token_for: 'foo' },
        preflight: {
          status: 'complete',
          is_valid: true,
          error_count: 0,
          warning_count: 0,
          results: {
            'step-1': { status: 'optional' },
            'step-3': { status: 'skip', message: 'This was skipped.' },
            'step-4': { status: 'skip', logs: 'Test log' },
          },
          is_ready: true,
        },
      });

      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
        1,
      );
      expect(getByText('This was skipped.')).toBeVisible();
    });

    describe('checkbox change', () => {
      test('calls handleStepsChange with step id and checked boolean', () => {
        const { container } = setup({
          preflight: { status: 'complete', is_valid: true, is_ready: true },
          user: { valid_token_for: 'me' },
        });

        const checkbox = container.querySelector('#step-step-4');
        fireEvent.click(checkbox);

        expect(handleStepsChange).toHaveBeenCalledWith('step-4', true);
      });
    });
  });
});
