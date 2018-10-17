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
  const setup = options => {
    const defaults = { plan: defaultPlan, user: null };
    const opts = { ...defaults, ...options };
    const { getByText, container } = render(
      <StepsTable
        plan={opts.plan}
        user={opts.user}
        preflight={opts.preflight}
      />,
    );
    return { getByText, container };
  };

  test('renders steps', () => {
    const { getByText } = setup();

    expect(getByText('Step 1')).toBeVisible();
    expect(getByText('Step 2')).toBeVisible();
    expect(getByText('Step 3')).toBeVisible();
    expect(getByText('Step 4')).toBeVisible();
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
        preflight: { is_ready: true },
      });

      expect(
        container.querySelectorAll('input[type="checkbox"][disabled]'),
      ).toHaveLength(2);
    });
  });

  describe('<NameDataCell> click', () => {
    test('expands accordion', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Step 1'));

      expect(getByText('This is a step description.')).toBeVisible();
    });
  });
});
