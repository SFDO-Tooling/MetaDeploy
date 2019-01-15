import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Toasts from 'components/plans/toasts';

const defaultModel = {
  status: 'started',
};

const defaultLabel = 'Pre-install validation';

describe('<Toasts />', () => {
  const setup = options => {
    const defaults = {
      model: defaultModel,
      label: defaultLabel,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container, rerender } = render(
      <Toasts model={opts.model} label={opts.label} />,
    );
    return { getByText, container, rerender };
  };

  describe('started model', () => {
    test('renders nothing', () => {
      const { container } = setup();

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('already-completed model', () => {
    test('renders nothing', () => {
      const { container } = setup({ model: { status: 'complete' } });

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });

  describe('model fails', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const model = { status: 'failed' };
      rerender(<Toasts model={model} label={defaultLabel} />);

      expect(getByText('Pre-install validation has failed.')).toBeVisible();
    });
  });

  describe('model cancels', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const model = { status: 'canceled' };
      rerender(<Toasts model={model} label={defaultLabel} />);

      expect(
        getByText('Pre-install validation has been canceled.'),
      ).toBeVisible();
    });
  });

  describe('model completes with errors', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const model = { status: 'complete', error_count: 1 };
      rerender(<Toasts model={model} label={defaultLabel} />);

      expect(
        getByText('Pre-install validation completed with errors.'),
      ).toBeVisible();
    });
  });

  describe('model completes with warnings', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const model = {
        status: 'complete',
        error_count: 0,
        warning_count: 1,
      };
      rerender(<Toasts model={model} label={defaultLabel} />);

      expect(
        getByText('Pre-install validation completed with warnings.'),
      ).toBeVisible();
    });
  });

  describe('model completes successfully', () => {
    test('renders toast with message', () => {
      const { getByText, rerender } = setup();
      const model = { status: 'complete', error_count: 0 };
      rerender(<Toasts model={model} label={defaultLabel} />);

      expect(
        getByText('Pre-install validation completed successfully.'),
      ).toBeVisible();
    });
  });

  describe('close-toast click', () => {
    test('removes toast', () => {
      const { getByText, container, rerender } = setup();
      const model = { status: 'complete', error_count: 0 };
      rerender(<Toasts model={model} label={defaultLabel} />);
      fireEvent.click(getByText('Close'));

      expect(
        container.querySelector('.slds-notify-container').children,
      ).toHaveLength(0);
    });
  });
});
