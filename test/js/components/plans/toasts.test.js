import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Toasts from 'components/plans/toasts';

const defaultPreflight = {
  status: 'started',
};

describe('<Toasts />', () => {
  const setup = options => {
    const defaults = {
      preflight: defaultPreflight,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container, rerender } = render(
      <Toasts preflight={opts.preflight} />,
    );
    return { getByText, container, rerender };
  };

  describe('started preflight', () => {
    test('renders nothing', () => {
      const { container } = setup();

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('already-completed preflight', () => {
    test('renders nothing', () => {
      const { container } = setup({ preflight: { status: 'complete' } });

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('preflight fails', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = { status: 'failed' };
      rerender(<Toasts preflight={preflight} />);

      expect(getByText('Pre-install validation has failed.')).toBeVisible();
    });
  });

  describe('preflight completes with errors', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = { status: 'complete', error_count: 1 };
      rerender(<Toasts preflight={preflight} />);

      expect(
        getByText('Pre-install validation completed with errors.'),
      ).toBeVisible();
    });
  });

  describe('preflight completes with warnings', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = {
        status: 'complete',
        error_count: 0,
        warning_count: 1,
      };
      rerender(<Toasts preflight={preflight} />);

      expect(
        getByText('Pre-install validation completed with warnings.'),
      ).toBeVisible();
    });
  });

  describe('preflight completes successfully', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = { status: 'complete', error_count: 0 };
      rerender(<Toasts preflight={preflight} />);

      expect(
        getByText('Pre-install validation completed successfully.'),
      ).toBeVisible();
    });
  });

  describe('close-toast click', () => {
    test('removes toast', () => {
      const { getByText, container, rerender } = setup();
      const preflight = { status: 'complete', error_count: 0 };
      rerender(<Toasts preflight={preflight} />);
      fireEvent.click(getByText('Close'));

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });
});
