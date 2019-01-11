import React from 'react';
import { render } from 'react-testing-library';

import JobResults from 'components/plans/jobResults';

const defaultJob = {
  status: 'complete',
  error_count: 4,
  warning_count: 3,
  is_valid: true,
  results: {
    plan: [
      { status: 'error', message: 'This plan error.' },
      { status: 'error' },
      { status: 'unknown', message: 'How did this happen?' },
      { status: 'warn', message: 'This plan warning.' },
    ],
    1: [
      { status: 'error', message: 'This error.' },
      { status: 'warn', message: 'This warning.' },
    ],
    2: [
      { status: 'error', message: 'This other error.' },
      { status: 'warn', message: 'This other warning.' },
    ],
    malformed: { foo: 'bar' },
  },
};

describe('<JobResults />', () => {
  const setup = options => {
    const defaults = {
      job: defaultJob,
      label: 'Pre-install validation',
      failMessage: '',
    };
    const opts = { ...defaults, ...options };
    const { getByText, queryByText, container } = render(
      <JobResults
        job={opts.job}
        label={opts.label}
        failMessage={opts.failMessage}
        successMessage={opts.successMessage}
      />,
    );
    return { getByText, queryByText, container };
  };

  describe('started preflight', () => {
    test('renders nothing', () => {
      const { container } = setup({ job: { status: 'started' } });

      expect(container.children).toHaveLength(0);
    });
  });

  describe('completed preflight with error', () => {
    test('displays error message', () => {
      const job = {
        status: 'complete',
        error_count: 1,
        warning_count: 0,
        is_valid: true,
        results: {
          1: [{ status: 'error', message: 'This error.' }],
        },
      };
      const { getByText } = setup({
        job,
        failMessage: 'Do something to fix it.',
      });

      expect(
        getByText('Pre-install validation encountered 1 error.'),
      ).toBeVisible();
      expect(getByText('Do something to fix it.')).toBeVisible();
    });
  });

  describe('completed preflight with warning', () => {
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
        getByText('Pre-install validation encountered 1 warning.'),
      ).toBeVisible();
    });

    describe('invalid preflight', () => {
      test('displays invalid message', () => {
        const job = {
          status: 'complete',
          error_count: 0,
          warning_count: 1,
          is_valid: false,
          results: {
            1: [{ status: 'warn', message: 'This warning.' }],
          },
        };
        const { getByText } = setup({ job });

        expect(
          getByText('Pre-install validation has expired; please run it again.'),
        ).toBeVisible();
      });
    });
  });

  describe('completed preflight with errors and warnings', () => {
    test('displays error/warning messages', () => {
      const { getByText, queryByText } = setup();

      expect(
        getByText(
          'Pre-install validation encountered 4 errors and 3 warnings.',
        ),
      ).toBeVisible();
      expect(getByText('This plan error.')).toBeVisible();
      expect(getByText('This plan warning.')).toBeVisible();
      expect(queryByText('How did this happen?')).toBeNull();
    });
  });

  describe('failed preflight', () => {
    test('displays error message', () => {
      const job = {
        status: 'failed',
        error_count: 0,
        warning_count: 0,
      };
      const { getByText } = setup({ job });

      expect(
        getByText('Pre-install validation encountered errors.'),
      ).toBeVisible();
    });
  });

  describe('completed successful preflight', () => {
    test('displays standard success message', () => {
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        is_valid: true,
        results: {},
      };
      const { getByText } = setup({ job });

      expect(
        getByText('Pre-install validation completed successfully.'),
      ).toBeVisible();
    });

    test('displays custom success message', () => {
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        is_valid: true,
        results: {},
      };
      const { getByText } = setup({ job, successMessage: 'Yay!' });

      expect(getByText('Yay!')).toBeVisible();
    });
  });

  describe('invalid preflight', () => {
    test('displays invalid message', () => {
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        is_valid: false,
        results: {},
      };
      const { getByText } = setup({ job });

      expect(
        getByText('Pre-install validation has expired; please run it again.'),
      ).toBeVisible();
    });
  });
});
