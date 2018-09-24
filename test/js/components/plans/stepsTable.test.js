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
  const setup = (plan = defaultPlan) => {
    const { getByText, queryByText, getByAltText } = render(
      <StepsTable plan={plan} />,
    );
    return { getByText, queryByText, getByAltText };
  };

  test('renders steps', () => {
    const { getByText } = setup();

    expect(getByText('My Plan')).toBeVisible();
    expect(getByText('Step 1')).toBeVisible();
    expect(getByText('Step 2')).toBeVisible();
    expect(getByText('Step 3')).toBeVisible();
    expect(getByText('Step 4')).toBeVisible();
  });

  describe('<NameDataCell> click', () => {
    test('expands accordion', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Step 1'));

      expect(getByText('This is a step description.')).toBeVisible();
    });
  });
});
