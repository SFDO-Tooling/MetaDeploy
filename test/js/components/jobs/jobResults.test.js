import React from 'react';

import JobResults from '@/js/components/jobs/jobResults';

import { render } from './../../utils';

const defaultJob = {
  status: 'complete',
  error_count: 4,
  warning_count: 3,
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
};

describe('<jobResults />', () => {
  const setup = (options) => {
    const defaults = {
      job: defaultJob,
    };
    const opts = { ...defaults, ...options };
    const { getByText, queryByText, container } = render(
      <JobResults job={opts.job} />,
    );
    return { getByText, queryByText, container };
  };

  describe('started job', () => {
    test('renders nothing', () => {
      const { container } = setup({ job: { status: 'started' } });

      expect(container.children).toHaveLength(0);
    });
  });

  describe('completed job with error', () => {
    test('displays error message', () => {
      const job = {
        status: 'complete',
        error_count: 1,
        warning_count: 0,
        results: {
          1: [{ status: 'error', message: 'This error.' }],
        },
      };
      const { getByText } = setup({
        job,
      });

      expect(
        getByText('Installation encountered 1 error.', { exact: false }),
      ).toBeVisible();
      expect(getByText('View Installation Error Details & Link')).toBeVisible();
    });
  });

  describe('completed job with warning', () => {
    test('displays warning message', () => {
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 1,
        results: {
          1: [{ status: 'warn', message: 'This warning.' }],
        },
      };
      const { getByText } = setup({ job });

      expect(
        getByText('Installation encountered 1 warning.', { exact: false }),
      ).toBeVisible();
    });
  });

  describe('completed job with errors and warnings', () => {
    test('displays error/warning messages', () => {
      const { getByText } = setup();

      expect(
        getByText('Installation encountered 4 errors and 3 warnings.', {
          exact: false,
        }),
      ).toBeVisible();
    });
  });

  describe('failed job', () => {
    test('displays error message', () => {
      const job = {
        status: 'failed',
        error_count: 0,
        warning_count: 0,
      };
      const { getByText } = setup({ job });

      expect(
        getByText('Installation encountered errors.', { exact: false }),
      ).toBeVisible();
    });
  });

  describe('canceled job', () => {
    test('displays error message', () => {
      const job = {
        status: 'canceled',
        error_count: 0,
        warning_count: 0,
      };
      const { getByText } = setup({ job });

      expect(getByText('Installation was canceled.')).toBeVisible();
    });
  });

  describe('completed successful job', () => {
    test('displays standard success message', () => {
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        results: {},
      };
      const { getByText } = setup({ job });

      expect(getByText('Installation completed successfully.')).toBeVisible();
    });
  });
});
