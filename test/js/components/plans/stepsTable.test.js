import { fireEvent } from '@testing-library/react';
import React from 'react';

import StepsTable from '@/components/plans/stepsTable';

import { render, rerenderWithI18n } from './../../utils';

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
  supported_orgs: 'Persistent',
};
const selectedSteps = new Set(['step-1', 'step-2', 'step-3']);

describe('<StepsTable />', () => {
  const handleStepsChange = jest.fn();

  const setup = (options) => {
    const defaults = { plan: defaultPlan, canInstall: false, selectedSteps };
    const opts = { ...defaults, ...options };
    return render(
      <StepsTable
        plan={opts.plan}
        canInstall={opts.canInstall}
        preflight={opts.preflight}
        steps={opts.plan.steps}
        selectedSteps={opts.selectedSteps}
        job={opts.job}
        handleStepsChange={handleStepsChange}
      />,
    );
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
            'step-1': [{ logs: 'Test log 1' }],
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
            'step-1': [{ logs: 'Test log 1 and more' }],
          },
        };
        rerenderWithI18n(
          <StepsTable
            plan={defaultPlan}
            steps={defaultPlan.steps}
            selectedSteps={selectedSteps}
            job={job}
            handleStepsChange={handleStepsChange}
          />,
          rerender,
        );
        activeLog = container.querySelector('[aria-hidden="false"] code');

        // Newly-active log is expanded
        expect(activeLog.innerHTML).toEqual('Test log 1 and more');

        job = {
          ...job,
          results: {
            ...job.results,
            'step-1': [{ status: 'ok', logs: 'Test log 1' }],
            'step-2': [{ logs: 'Test log 2' }],
          },
        };
        rerenderWithI18n(
          <StepsTable
            plan={defaultPlan}
            steps={defaultPlan.steps}
            selectedSteps={selectedSteps}
            job={job}
            handleStepsChange={handleStepsChange}
          />,
          rerender,
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
            'step-1': [{ status: 'ok', logs: 'Test log 1' }],
            'step-2': [{ status: 'ok', logs: 'Test log 2' }],
            'step-3': [{ logs: 'Test log 3' }],
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
            'step-3': [{ status: 'ok', logs: 'Test log 3' }],
          },
        };
        rerenderWithI18n(
          <StepsTable
            plan={defaultPlan}
            steps={defaultPlan.steps}
            selectedSteps={selectedSteps}
            job={changedJob}
            handleStepsChange={handleStepsChange}
          />,
          rerender,
        );
        log = container.querySelector('[aria-hidden="false"] code');

        // All logs are closed
        expect(log).toBeNull();
      });
    });
  });

  test('show-all and hide-all once a job is complete', () => {
    const { getAllByText, container } = setup({
      job: {
        id: 'job-1',
        plan: 'plan-1',
        status: 'complete',
        steps: ['step-1', 'step-2', 'step-3'],
        results: {
          'step-1': [{ status: 'ok', logs: 'Test log 1' }],
          'step-2': [{ status: 'ok', logs: 'Test log 2' }],
          'step-3': [{ status: 'ok', logs: 'Test log 3' }],
        },
      },
    });
    const toggle = getAllByText('Steps')[0];
    let log = container.querySelector('[aria-hidden="false"] code');

    // logs are collapsed
    expect(log).toBeNull();

    fireEvent.click(toggle);
    log = container.querySelectorAll('[aria-hidden="false"] code');

    // logs are expanded
    expect(log).toHaveLength(3);

    fireEvent.click(toggle);
    log = container.querySelector('[aria-hidden="false"] code');

    // loggs are collapsed
    expect(log).toBeNull();
  });

  describe('<NameDataCell>', () => {
    describe('existing preflight', () => {
      test('displays optional message', () => {
        const { getByText } = setup({
          preflight: {
            status: 'complete',
            results: {
              'step-1': [
                {
                  status: 'optional',
                  message: 'This became optional.',
                },
              ],
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
              'step-1': [{ status: 'warn', message: 'This warning.' }],
              'step-2': [{ status: 'error', message: 'This other error.' }],
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
              'step-1': [
                {
                  status: 'error',
                  message: 'This error.',
                  logs: 'These logs.',
                },
              ],
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
              'step-1': [{ status: 'ok', logs: 'Test log 1' }],
              'step-2': [{ logs: 'Test log 2' }],
              foo: [{ status: 'ok', logs: 'Another test log' }],
            },
          },
        });
        fireEvent.click(getByText('Step 1'));
        const log = container.querySelector('[aria-hidden="false"] code');

        expect(log.innerHTML).toEqual('Test log 1');
      });
    });

    test('click collapses accordion logs', () => {
      const { getByText, container } = setup({
        job: {
          id: 'job-1',
          plan: 'plan-1',
          status: 'started',
          steps: ['step-1', 'step-2', 'step-3'],
          results: {
            'step-1': [{ status: 'ok', logs: 'Test log 1' }],
            'step-2': [{ logs: 'Test log 2' }],
          },
        },
      });

      let log = container.querySelector('[aria-hidden="false"] code');

      // All logs are closed
      expect(log).toBeNull();

      fireEvent.click(getByText('Step 1'));
      log = container.querySelector('[aria-hidden="false"] code');

      // Clicked log is expanded
      expect(log.innerHTML).toEqual('Test log 1');

      fireEvent.click(getByText('Step 1'));
      log = container.querySelector('[aria-hidden="false"] code');

      // All logs are closed
      expect(log).toBeNull();
    });

    test('closing active step-log disables auto-expand/collapse', () => {
      let job = {
        id: 'job-1',
        plan: 'plan-1',
        status: 'started',
        steps: ['step-1', 'step-2', 'step-3'],
        results: {
          'step-1': [{ status: 'ok', logs: 'Test log 1' }],
          'step-2': [{ logs: 'Test log 2' }],
        },
      };
      const { getByText, getAllByText, container, rerender } = setup({
        job,
      });
      const toggle = getAllByText('Steps')[0];
      fireEvent.click(toggle);
      let activeLog = container.querySelector('[aria-hidden="false"] code');

      // Active log is expanded
      expect(activeLog.innerHTML).toEqual('Test log 2');

      fireEvent.click(getByText('Step 2'));
      activeLog = container.querySelector('[aria-hidden="false"] code');

      // All logs are closed
      expect(activeLog).toBeNull();

      // Step completes...
      job = {
        ...job,
        results: {
          ...job.results,
          'step-2': [{ status: 'ok', logs: 'Test log 2' }],
        },
      };
      rerenderWithI18n(
        <StepsTable
          plan={defaultPlan}
          steps={defaultPlan.steps}
          selectedSteps={selectedSteps}
          job={job}
          handleStepsChange={handleStepsChange}
        />,
        rerender,
      );
      activeLog = container.querySelector('[aria-hidden="false"] code');

      // Newly-active log is *not* auto-expanded
      expect(activeLog).toBeNull();
    });
  });

  describe('<RequiredDataCell>', () => {
    test('becomes optional if preflight result specifies', () => {
      const { queryByText } = setup({
        preflight: {
          status: 'complete',
          results: {
            'step-1': [{ status: 'optional' }],
            'step-2': [{ status: 'optional' }],
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
    describe('with preflight', () => {
      test('returns skipped, optional', () => {
        const { getByText } = setup({
          canInstall: true,
          preflight: {
            status: 'complete',
            is_ready: true,
            results: {
              'step-1': [{ status: 'optional' }, { status: 'optional' }],
              'step-2': [{ status: 'skip' }, { status: 'skip' }],
            },
          },
        });

        expect(getByText('Step 1')).toBeVisible();
      });
    });

    describe('with job', () => {
      test('returns completed, skipped, installing, checkbox', () => {
        const { getByText } = setup({
          job: {
            id: 'job-1',
            plan: 'plan-1',
            status: 'started',
            steps: ['step-1', 'step-2', 'step-4'],
            results: {
              'step-1': [{ status: 'ok', logs: 'Test log' }],
              'step-2': [{ logs: 'Test log' }],
              foo: [{ status: 'ok', logs: 'Another test log' }],
            },
          },
        });

        expect(getByText('Installing…')).toBeVisible();
        expect(getByText('Skipped')).toBeVisible();
        expect(getByText('Completed')).toBeVisible();
        expect(getByText('Waiting to install')).toBeVisible();
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
                'step-1': [{ status: 'ok' }],
                'step-2': [{ status: 'error', message: 'totally failed' }],
              },
            },
          });

          expect(getByText('totally failed')).toBeVisible();
          expect(queryByText('Installing…')).toBeNull();
          expect(queryByText('Waiting to install')).toBeNull();
        });
      });
    });

    test('hidden if canInstall: false', () => {
      const { container } = setup();
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(0);
    });

    test('hidden if no ready preflight', () => {
      const { container } = setup({ canInstall: true });
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');

      expect(checkboxes).toHaveLength(0);
    });

    test('no checkbox if required', () => {
      const { container } = setup({
        canInstall: true,
        preflight: { status: 'complete', is_valid: true, is_ready: true },
      });

      expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
        2,
      );
    });

    test('no checkbox if skipped, checkbox if optional', () => {
      const { container, getByText } = setup({
        canInstall: true,
        preflight: {
          status: 'complete',
          is_valid: true,
          error_count: 0,
          warning_count: 0,
          results: {
            'step-1': [{ status: 'optional' }],
            'step-3': [{ status: 'skip', message: 'This was skipped.' }],
            'step-4': [{ status: 'skip', logs: 'Test log' }],
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
          canInstall: true,
        });

        const checkbox = container.querySelector('#step-step-4');
        fireEvent.click(checkbox);

        expect(handleStepsChange).toHaveBeenCalledWith('step-4', true);
      });
    });
  });
});
