import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import StepsTable from 'components/plans/stepsTable';

const defaultPlan = {
  id: 1,
  slug: 'my-plan',
  title: 'My Plan',
  steps: [
    {
      id: 1,
      name: 'Step 1',
      description: 'This is a step description.',
      kind: 'Metadata',
      kind_icon: 'package',
      is_required: true,
      is_recommended: true,
    },
    {
      id: 2,
      name: 'Step 2',
      kind: 'One Time Apex',
      kind_icon: 'apex',
      is_required: true,
      is_recommended: false,
    },
    {
      id: 3,
      name: 'Step 3',
      kind: 'Managed Package',
      kind_icon: 'archive',
      is_required: false,
      is_recommended: true,
    },
    {
      id: 4,
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
    const { getByText, queryByText, container } = render(
      <StepsTable
        plan={opts.plan}
        user={opts.user}
        preflight={opts.preflight}
        selectedSteps={new Set([1, 2, 3])}
        handleStepsChange={handleStepsChange}
      />,
    );
    return { getByText, queryByText, container };
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
              1: [{ status: 'optional', message: 'This became optional.' }],
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
              1: [
                { status: 'error', message: 'This error.' },
                { status: 'warn', message: 'This warning.' },
              ],
              2: [
                { status: 'error', message: 'This other error.' },
                { status: 'warn', message: 'This other warning.' },
              ],
            },
          },
        });

        expect(getByText('This error.')).toBeVisible();
        expect(getByText('This warning.')).toBeVisible();
        expect(getByText('This other error.')).toBeVisible();
        expect(getByText('This other warning.')).toBeVisible();
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
            1: [{ status: 'optional' }],
            2: [{ status: 'optional' }],
          },
        },
      });

      expect(queryByText('Required')).toBeNull();
    });
  });

  describe('<InstallDataCell>', () => {
    test('disabled if no user', () => {
      const { container } = setup();

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(4);
    });

    test('disabled if no valid token', () => {
      const { container } = setup({ user: {} });

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(4);
    });

    test('disabled if no ready preflight', () => {
      const { container } = setup({ user: { valid_token_for: 'foo' } });

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(4);
    });

    test('disabled if required', () => {
      const { container } = setup({
        user: { valid_token_for: 'foo' },
        preflight: { status: 'complete', is_valid: true, is_ready: true },
      });

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(2);
    });

    test('disabled if skipped, enabled if optional', () => {
      const { container, getByText } = setup({
        user: { valid_token_for: 'foo' },
        preflight: {
          status: 'complete',
          is_valid: true,
          error_count: 0,
          warning_count: 0,
          results: {
            1: [{ status: 'optional' }],
            3: [{ status: 'skip', message: 'This was skipped.' }],
            4: [{ status: 'skip' }],
          },
          is_ready: true,
        },
      });

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(3);
      expect(getByText('This was skipped.')).toBeVisible();
    });

    describe('checkbox change', () => {
      test('calls handleStepsChange with step id and checked boolean', () => {
        const { container } = setup();
        const checkbox = container.querySelector(
          'input[type="checkbox"]:not(:checked)',
        );
        fireEvent.click(checkbox);

        expect(handleStepsChange).toHaveBeenCalledWith(4, true);
      });
    });
  });
});
