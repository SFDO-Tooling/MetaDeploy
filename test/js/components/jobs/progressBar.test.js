import React from 'react';
import { render } from 'react-testing-library';

import ProgressBar from 'components/jobs/progressBar';

const defaultJob = {
  id: 'job-1',
  steps: ['1', '2', '3', '4'],
  results: { '1': [{ status: 'ok' }] },
  status: 'started',
};

describe('<ProgressBar />', () => {
  const setup = options => {
    const defaults = {
      job: defaultJob,
    };
    const opts = { ...defaults, ...options };
    const { getByText, queryByText } = render(<ProgressBar job={opts.job} />);
    return { getByText, queryByText };
  };

  test('renders progress bar', () => {
    const { getByText } = setup();

    expect(getByText('25% Complete')).toBeVisible();
  });

  describe('complete', () => {
    test('renders complete progress bar', () => {
      const { getByText } = setup({
        job: {
          ...defaultJob,
          results: {
            '1': [{ status: 'ok' }],
            '2': [{ status: 'ok' }],
            '3': [{ status: 'ok' }],
            '4': [{ status: 'ok' }],
          },
          status: 'complete',
        },
      });

      expect(getByText('100% Complete')).toBeVisible();
    });
  });

  describe('failed', () => {
    test('renders failed progress bar', () => {
      const { getByText, queryByText } = setup({
        job: {
          ...defaultJob,
          results: {
            '1': [{ status: 'ok' }],
            '2': [{ status: 'error' }],
          },
          status: 'failed',
        },
      });

      expect(getByText('Failed')).toBeVisible();
      expect(queryByText('100% Complete')).toBeNull();
    });
  });

  describe('canceled', () => {
    test('renders canceled progress bar', () => {
      const { getByText, queryByText } = setup({
        job: {
          ...defaultJob,
          results: {
            '1': [{ status: 'ok' }],
            '2': [{ status: 'error' }],
          },
          status: 'canceled',
        },
      });

      expect(getByText('Canceled')).toBeVisible();
      expect(queryByText('100% Complete')).toBeNull();
    });
  });
});
