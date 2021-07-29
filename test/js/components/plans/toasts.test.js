import { fireEvent } from '@testing-library/react';
import React from 'react';

import Toasts from '@/js/components/plans/toasts';

import { render, rerenderWithI18n } from './../../utils';

const defaultJob = {
  status: 'started',
};

const defaultLabel = 'Installation';

describe('<Toasts />', () => {
  const setup = (options) => {
    const defaults = {
      job: defaultJob,
      label: defaultLabel,
    };
    const opts = { ...defaults, ...options };
    return render(<Toasts job={opts.job} label={opts.label} />);
  };

  describe('started job', () => {
    test('renders nothing', () => {
      const { container } = setup();

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('already-completed job', () => {
    test('renders nothing', () => {
      const { container } = setup({ job: { status: 'complete' } });

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('job fails', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'failed' };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);

      expect(getByText('Installation has failed.')).toBeVisible();
    });
  });

  describe('job cancels', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'canceled' };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);

      expect(getByText('Installation has been canceled.')).toBeVisible();
    });
  });

  describe('preflight cancels', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = { status: 'canceled' };
      rerenderWithI18n(
        <Toasts preflight={preflight} label="Pre-install validation" />,
        rerender,
      );

      expect(getByText('Pre-install validation has failed.')).toBeVisible();
    });
  });

  describe('job completes with errors', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'complete', error_count: 1 };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);

      expect(getByText('Installation completed with errors.')).toBeVisible();
    });
  });

  describe('job completes with warnings', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = {
        status: 'complete',
        error_count: 0,
        warning_count: 1,
      };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);

      expect(getByText('Installation completed with warnings.')).toBeVisible();
    });
  });

  describe('job completes successfully', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'complete', error_count: 0 };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);

      expect(getByText('Installation completed successfully.')).toBeVisible();
    });
  });

  describe('close-toast click', () => {
    test('removes toast', () => {
      const { getByText, container, rerender } = setup();
      const job = { status: 'complete', error_count: 0 };
      rerenderWithI18n(<Toasts job={job} label={defaultLabel} />, rerender);
      fireEvent.click(getByText('Close'));

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });
});
