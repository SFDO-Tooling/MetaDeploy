import React from 'react';

import PreflightResults, {
  getErrorInfo,
} from '@/components/plans/preflightResults';

import { render } from './../../utils';

const defaultPreflight = {
  status: 'complete',
  error_count: 4,
  warning_count: 3,
  is_valid: true,
  results: {
    plan: [{ status: 'error', message: 'This plan error.' }],
    1: [{ status: 'warn', message: 'This warning.' }],
    2: [{ status: 'error', message: 'This other error.' }],
    malformed: { foo: 'bar' },
  },
};

describe('<PreflightResults />', () => {
  const setup = (options) => {
    const defaults = {
      preflight: defaultPreflight,
    };
    const opts = { ...defaults, ...options };
    const { getByText, queryByText, container } = render(
      <PreflightResults preflight={opts.preflight} />,
    );
    return { getByText, queryByText, container };
  };

  describe('started preflight', () => {
    test('renders nothing', () => {
      const { container } = setup({ preflight: { status: 'started' } });

      expect(container.children).toHaveLength(0);
    });
  });

  describe('completed preflight with error', () => {
    test('displays error message', () => {
      const preflight = {
        status: 'complete',
        error_count: 1,
        warning_count: 0,
        is_valid: true,
        results: {
          1: [{ status: 'error', message: 'This error.' }],
        },
      };
      const { getByText } = setup({
        preflight,
      });

      expect(
        getByText('Pre-install validation encountered 1 error.'),
      ).toBeVisible();
    });
  });

  describe('completed preflight with warning', () => {
    test('displays warning message', () => {
      const preflight = {
        status: 'complete',
        error_count: 0,
        warning_count: 1,
        results: {
          1: [{ status: 'warn', message: 'This warning.' }],
        },
        is_valid: true,
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation encountered 1 warning.'),
      ).toBeVisible();
    });

    describe('invalid preflight with warning', () => {
      test('displays invalid message', () => {
        const preflight = {
          status: 'complete',
          error_count: 0,
          warning_count: 1,
          is_valid: false,
          results: {
            1: [{ status: 'warn', message: 'This warning.' }],
          },
        };
        const { getByText } = setup({ preflight });

        expect(
          getByText('Pre-install validation has expired; please run it again.'),
        ).toBeVisible();
      });
    });
  });

  describe('completed preflight with errors and warnings', () => {
    test('displays error/warning messages', () => {
      const { getByText } = setup();
      expect(
        getByText(
          'Pre-install validation encountered 4 errors and 3 warnings.',
        ),
      ).toBeVisible();
      expect(getByText('This plan error.')).toBeVisible();
    });
  });

  describe('failed preflight', () => {
    test('displays error message', () => {
      const preflight = {
        status: 'failed',
        error_count: 0,
        warning_count: 0,
        is_valid: true,
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation encountered errors.'),
      ).toBeVisible();
    });
  });

  describe('canceled preflight', () => {
    test('displays error message', () => {
      const preflight = {
        status: 'canceled',
        error_count: 0,
        warning_count: 0,
        is_valid: true,
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation encountered errors.'),
      ).toBeVisible();
    });
  });

  describe('completed successful preflight', () => {
    test('displays standard success message', () => {
      const preflight = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        is_valid: true,
        results: {},
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation completed successfully.'),
      ).toBeVisible();
    });
  });

  describe('invalid preflight', () => {
    test('displays invalid message', () => {
      const preflight = {
        status: 'complete',
        error_count: 0,
        warning_count: 0,
        is_valid: false,
        results: {},
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation has expired; please run it again.'),
      ).toBeVisible();
    });
  });
});

describe('getErrorInfo', () => {
  describe('no job or preflight', () => {
    test('renders nothing', () => {
      const result = getErrorInfo({});

      expect(result).toEqual({ failed: false, message: null });
    });
  });
});
