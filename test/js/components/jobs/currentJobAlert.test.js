import { fireEvent } from '@testing-library/react';
import React from 'react';

import CurrentJobAlert from '@/js/components/jobs/currentJobAlert';

import { render } from './../../utils';

describe('<CurrentJobAlert />', () => {
  const setup = (options) => {
    const opts = {
      currentJob: {
        id: 'my-job',
        product_slug: 'my-product',
        version_label: 'my-version',
        plan_slug: 'my-plan',
        plan_average_duration: '119.999',
      },
      ...options,
    };
    const { getByText } = render(
      <CurrentJobAlert currentJob={opts.currentJob} history={opts.history} />,
    );
    return { getByText };
  };

  test('renders with duration', () => {
    const { getByText } = setup();

    expect(
      getByText(
        'An installation is currently running on this org. Average install time is 2 minutes.',
      ),
    ).toBeVisible();
  });

  test('renders without duration', () => {
    const { getByText } = setup({
      currentJob: {
        id: 'my-job',
        product_slug: 'my-product',
        version_label: 'my-version',
        plan_slug: 'my-plan',
        plan_average_duration: null,
      },
    });

    expect(
      getByText('An installation is currently running on this org.'),
    ).toBeVisible();
  });

  test('calls window.location.assign on click', () => {
    const { getByText } = setup();

    jest.spyOn(window.location, 'assign');
    fireEvent.click(getByText('View installation.'));

    expect(window.location.assign).toHaveBeenCalledTimes(1);
  });

  test('calls history.push on click if available', () => {
    const history = { push: jest.fn() };
    const { getByText } = setup({ history });

    fireEvent.click(getByText('View installation.'));

    expect(history.push).toHaveBeenCalledTimes(1);
  });
});
