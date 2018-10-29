import React from 'react';
import { render } from 'react-testing-library';

import PreflightResults from 'components/plans/preflightResults';

const defaultPreflight = {
  status: 'complete',
  has_errors: true,
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

describe('<PreflightResults />', () => {
  const setup = options => {
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
        has_errors: true,
        is_valid: true,
        results: {
          1: [{ status: 'error', message: 'This error.' }],
        },
      };
      const { getByText } = setup({ preflight });

      expect(getByText('Pre-install validation found 1 error.')).toBeVisible();
    });
  });

  describe('completed preflight with warning', () => {
    test('displays warning message', () => {
      const preflight = {
        status: 'complete',
        has_errors: true,
        is_valid: true,
        results: {
          1: [{ status: 'warn', message: 'This warning.' }],
        },
      };
      const { getByText } = setup({ preflight });

      expect(
        getByText('Pre-install validation found 1 warning.'),
      ).toBeVisible();
    });
  });

  describe('completed preflight with errors and warnings', () => {
    test('displays error/warning messages', () => {
      const { getByText, queryByText } = setup();

      expect(
        getByText('Pre-install validation found 4 errors and 3 warnings.'),
      ).toBeVisible();
      expect(getByText('This plan error.')).toBeVisible();
      expect(getByText('This plan warning.')).toBeVisible();
      expect(queryByText('How did this happen?')).toBeNull();
    });
  });

  describe('failed preflight', () => {
    test('displays error message', () => {
      const preflight = {
        status: 'failed',
        has_errors: false,
        is_valid: true,
      };
      const { getByText } = setup({ preflight });

      expect(getByText('Pre-install validation found errors.')).toBeVisible();
    });
  });

  describe('completed successful preflight', () => {
    test('displays success message', () => {
      const preflight = {
        status: 'complete',
        has_errors: false,
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
        has_errors: false,
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
