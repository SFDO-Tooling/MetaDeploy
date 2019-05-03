import React from 'react';
import { fireEvent, render } from 'react-testing-library';

import StepsTable from 'components/plans/stepsTable';

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
  requires_preflight: true,
};
const selectedSteps = new Set(['step-1', 'step-2', 'step-3']);

describe('<StepsTable />', () => {
  const handleStepsChange = jest.fn();

  const setup = options => {
    const defaults = { plan: defaultPlan, user: null, selectedSteps };
    const opts = { ...defaults, ...options };
    const {
      getByText,
      getAllByText,
      queryByText,
      container,
      rerender,
    } = render(
      <StepsTable
        plan={opts.plan}
        user={opts.user}
        preflight={opts.preflight}
        selectedSteps={opts.selectedSteps}
        job={opts.job}
        handleStepsChange={handleStepsChange}
      />,
    );
    return { getByText, getAllByText, queryByText, container, rerender };
  };

  test('renders steps', () => {
    const { getByText } = setup();

    expect(getByText('Step 1')).toBeVisible();
    expect(getByText('Step 2')).toBeVisible();
    expect(getByText('Step 3')).toBeVisible();
    expect(getByText('Step 4')).toBeVisible();
  });

  describe('componentDidUpdate', () => {
    describe('step completes', () => {
      test('collapses previous step, expands current one', () => {
        let job = {
          id: 'job-1',
          plan: 'plan-1',
          status: 'started',
          steps: ['step-1', 'step-2', 'step-3'],
          results: {
            'step-1': { logs: 'Test log 1' },
          },
        };
        const { getAllByText, container, rerender } = setup({
          job,
        });
        const toggle = getAllByText('Steps')[0];
        fireEvent.click(toggle);
        let activeLog = container.querySelector('[aria-hidden="false"] code');

        // Active log is expanded
        expect(activeLog.innerHTML).toEqual('Test log 1');

        job = {
          ...job,
          results: {
            ...job.results,
            'step-1': { logs: 'Test log 1 and more' },
          },
        };
        rerender(
          <StepsTable
            plan={defaultPlan}
            selectedSteps={selectedSteps}
            job={job}
            handleStepsChange={handleStepsChange}
          />,
        );
        activeLog = container.querySelector('[aria-hidden="false"] code');

        // Newly-active log is expanded
        expect(activeLog.innerHTML).toEqual('Test log 1 and more');

        job = {
          ...job,
          results: {
            ...job.results,
            'step-1': { status: 'ok', logs: 'Test log 1' },
            'step-2': { logs: 'Test log 2' },
          },
        };
        rerender(
          <StepsTable
            plan={defaultPlan}
            selectedSteps={selectedSteps}
            job={job}
            handleStepsChange={handleStepsChange}
          />,
        );
        activeLog = container.querySelector('[aria-hidden="false"] code');

        // Newly-active log is expanded
        expect(activeLog.innerHTML).toEqual('Test log 2');
      });
    });

    describe('job completes', () => {
      test('collapses final step', () => {
        const job = {
          id: 'job-1',
          plan: 'plan-1',
          status: 'started',
          steps: ['step-1', 'step-2', 'step-3'],
          results: {
            'step-1': { status: 'ok', logs: 'Test log 1' },
            'step-2': { status: 'ok', logs: 'Test log 2' },
            'step-3': { logs: 'Test log 3' },
          },
        };
        const { getAllByText, container, rerender } = setup({
          job,
        });
        let log = container.querySelector('[aria-hidden="false"] code');

        // All logs are closed
        expect(log).toBeNull();

        const toggle = getAllByText('Steps')[0];
        fireEvent.click(toggle);
        log = container.querySelector('[aria-hidden="false"] code');

        // Final log is expanded
        expect(log.innerHTML).toEqual('Test log 3');

        const changedJob = {
          ...job,
          status: 'complete',
          results: {
            ...job.results,
            'step-3': { status: 'ok', logs: 'Test log 3' },
          },
        };
        rerender(
          <StepsTable
            plan={defaultPlan}
            selectedSteps={selectedSteps}
            job={changedJob}
            handleStepsChange={handleStepsChange}
          />,
        );
        log = container.querySelector('[aria-hidden="false"] code');

        // All logs are closed
        expect(log).toBeNull();
      });
    });
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

    describe('existing job', () => {
      test('displays error/warning messages', () => {
        const { getByText } = setup({
          job: {
            id: 'job-1',
            plan: 'plan-1',
            status: 'complete',
            steps: ['step-1', 'step-2', 'step-4'],
            results: {
              'step-1': {
                status: 'error',
                message: 'This error.',
                logs: 'These logs.',
              },
            },
          },
        });

        expect(getByText('This error.')).toBeVisible();
      });

      test('click expands accordion logs', () => {
        const { getByText, container } = setup({
          job: {
            id: 'job-1',
            plan: 'plan-1',
            status: 'started',
            steps: ['step-1', 'step-2', 'step-4'],
            results: {
              'step-1': { status: 'ok', logs: 'Test log 1' },
              'step-2': { logs: 'Test log 2' },
              foo: { status: 'ok', logs: 'Another test log' },
            },
          },
        });
        fireEvent.click(getByText('Step 1'));
        const log = container.querySelector('[aria-hidden="false"] code');

        expect(log.innerHTML).toEqual('Test log 1');
      });
    });

    test('click collapses accordian logs', () => {
      const { getByText, container } = setup({
        job: {
          id: 'job-1',
          plan: 'plan-1',
          status: 'started',
          steps: ['step-1', 'step-2', 'step-3'],
          results: {
            'step-1': { status: 'ok', logs: 'Test log 1' },
            'step-2': { logs: 'Test log 2' },
            foo: { status: 'ok', logs: 'Another test log' },
          },
        },
      });

      let log = container.querySelector('[aria-hidden="false"] code');
      // All logs are closed
      expect(log).toBeNull();
      fireEvent.click(getByText('Step 1'));

      log = container.querySelector('[aria-hidden="false"] code');

      expect(log.innerHTML).toEqual('Test log 1');
      fireEvent.click(getByText('Step 1'));

      log = container.querySelector('[aria-hidden="false"] code');
      expect(log).toBeNull();
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
