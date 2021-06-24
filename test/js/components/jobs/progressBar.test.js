import React from 'react';

import ProgressBar from '@/components/jobs/progressBar';

import { render, rerenderWithI18n } from './../../utils';

const defaultJob = {
  id: 'job-1',
  steps: ['1', '2', '3', '4'],
  results: { 1: [{ status: 'ok' }] },
  status: 'started',
};

describe('<ProgressBar />', () => {
  const setup = (options) => {
    const defaults = {
      job: defaultJob,
    };
    const opts = { ...defaults, ...options };
    const { getByText, queryByText, rerender } = render(
      <ProgressBar job={opts.job} />,
    );
    return { getByText, queryByText, rerender };
  };

  test('renders progress bar', () => {
    const { getByText } = setup();

    expect(getByText('25% Complete')).toBeVisible();
  });

  describe('step progress', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(window, 'clearInterval');
    });

    test('shows incremental progress within steps', () => {
      const job = { ...defaultJob };
      const { getByText, queryByText, rerender } = setup({ job });

      expect(getByText('25% Complete')).toBeVisible();

      jest.advanceTimersByTime(10 * 1000);

      expect(getByText('38% Complete')).toBeVisible();

      jest.advanceTimersByTime(10 * 1000);

      expect(getByText('45% Complete')).toBeVisible();

      job.results['2'] = [{ status: 'ok' }];
      rerenderWithI18n(<ProgressBar job={job} />, rerender);

      expect(getByText('50% Complete')).toBeVisible();

      job.status = 'failed';
      rerenderWithI18n(<ProgressBar job={job} />, rerender);

      expect(clearInterval).toHaveBeenCalledTimes(2);
      expect(queryByText('50% Complete')).toBeNull();
    });
  });

  describe('complete', () => {
    test('renders complete progress bar', () => {
      const { getByText } = setup({
        job: {
          ...defaultJob,
          results: {
            1: [{ status: 'ok' }],
            2: [{ status: 'ok' }],
            3: [{ status: 'ok' }],
            4: [{ status: 'ok' }],
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
            1: [{ status: 'ok' }],
            2: [{ status: 'error' }],
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
            1: [{ status: 'ok' }],
            2: [{ status: 'error' }],
          },
          status: 'canceled',
        },
      });

      expect(getByText('Canceled')).toBeVisible();
      expect(queryByText('100% Complete')).toBeNull();
    });
  });
});
