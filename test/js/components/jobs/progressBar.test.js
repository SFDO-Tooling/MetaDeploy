import React from 'react';

import ProgressBar from '@/js/components/jobs/progressBar';

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
    const { getByText, getAllByText, queryByText, queryAllByText, rerender } =
      render(<ProgressBar job={opts.job} />);
    return { getByText, getAllByText, queryByText, queryAllByText, rerender };
  };

  test('renders progress bar', () => {
    const { getAllByText } = setup();

    expect(getAllByText('25% Complete')).not.toBeNull();
  });

  describe('step progress', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(window, 'clearInterval');
    });

    test('shows incremental progress within steps', () => {
      const job = { ...defaultJob };
      const { getAllByText, queryAllByText, rerender } = setup({ job });

      expect(getAllByText('25% Complete')).toHaveLength(2);

      jest.advanceTimersByTime(10 * 1000);

      expect(getAllByText('38% Complete')).toHaveLength(2);

      jest.advanceTimersByTime(10 * 1000);

      expect(getAllByText('45% Complete')).toHaveLength(2);

      job.results['2'] = [{ status: 'ok' }];
      rerenderWithI18n(<ProgressBar job={job} />, rerender);

      expect(getAllByText('50% Complete')).toHaveLength(2);

      job.status = 'failed';
      rerenderWithI18n(<ProgressBar job={job} />, rerender);

      expect(clearInterval).toHaveBeenCalledTimes(2);
      expect(queryAllByText('50% Complete')).toHaveLength(0);
    });
  });

  describe('complete', () => {
    test('renders complete progress bar', () => {
      const { getAllByText } = setup({
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

      expect(getAllByText('100% Complete')).toHaveLength(2);
    });
  });

  describe('failed', () => {
    test('renders failed progress bar', () => {
      const { getByText, queryAllByText } = setup({
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
      expect(queryAllByText('100% Complete')).toHaveLength(1);
    });
  });

  describe('canceled', () => {
    test('renders canceled progress bar', () => {
      const { getByText, queryAllByText } = setup({
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
      expect(queryAllByText('100% Complete')).toHaveLength(1);
    });
  });
});
