import React from 'react';
import { fireEvent, render } from 'react-testing-library';

import Toasts from 'components/plans/toasts';

const defaultJob = {
  status: 'started',
};

const defaultLabel = 'Installation';

describe('<Toasts />', () => {
  const setup = options => {
    const defaults = {
      job: defaultJob,
      label: defaultLabel,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container, rerender } = render(
      <Toasts job={opts.job} label={opts.label} />,
    );
    return { getByText, container, rerender };
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
      rerender(<Toasts job={job} label={defaultLabel} />);

      expect(getByText('Installation has failed.')).toBeVisible();
    });
  });

  describe('job cancels', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'canceled' };
      rerender(<Toasts job={job} label={defaultLabel} />);

      expect(getByText('Installation has been canceled.')).toBeVisible();
    });
  });

  describe('preflight cancels', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const preflight = { status: 'canceled' };
      rerender(<Toasts preflight={preflight} label="Pre-install validation" />);

      expect(getByText('Pre-install validation has failed.')).toBeVisible();
    });
  });

  describe('job completes with errors', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'complete', error_count: 1 };
      rerender(<Toasts job={job} label={defaultLabel} />);

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
      rerender(<Toasts job={job} label={defaultLabel} />);

      expect(getByText('Installation completed with warnings.')).toBeVisible();
    });
  });

  describe('job completes successfully', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const job = { status: 'complete', error_count: 0 };
      rerender(<Toasts job={job} label={defaultLabel} />);

      expect(getByText('Installation completed successfully.')).toBeVisible();
    });
  });

  describe('close-toast click', () => {
    test('removes toast', () => {
      const { getByText, container, rerender } = setup();
      const job = { status: 'complete', error_count: 0 };
      rerender(<Toasts job={job} label={defaultLabel} />);
      fireEvent.click(getByText('Close'));

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });
});
