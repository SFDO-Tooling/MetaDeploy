import React from 'react';
import { fireEvent, render } from 'react-testing-library';

import PreflightWarningModal from 'components/plans/preflightWarningModal';

describe('<PreflightWarningModal />', () => {
  const defaultResults = {
    plan: { status: 'warn', message: 'This is a plan warning.' },
    'step-1': { status: 'warn', message: 'This is a step warning.' },
    'step-2': { status: 'warn' },
    'step-3': undefined,
  };
  const defaultSteps = [
    { id: 'step-1', name: 'Step 1' },
    { id: 'step-2', name: 'Step 2' },
    { id: 'step-3', name: 'Step 3' },
  ];

  const setup = options => {
    const defaults = {
      toggleModal: jest.fn(),
      startJob: jest.fn(),
      results: defaultResults,
      steps: defaultSteps,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText } = render(
      <PreflightWarningModal
        isOpen={true}
        toggleModal={opts.toggleModal}
        startJob={opts.startJob}
        results={opts.results}
        steps={opts.steps}
      />,
    );
    return { getByLabelText, getByText };
  };

  test('displays warning messages', () => {
    const { getByLabelText, getByText } = setup();

    expect(getByText('Potential Issues')).toBeVisible();
    expect(getByText('This is a plan warning.')).toBeVisible();
    expect(getByText('This is a step warning.')).toBeVisible();
    expect(
      getByLabelText('I understand these warnings', { exact: false }),
    ).toBeVisible();
    expect(getByText('Confirm')).toBeDisabled();
  });

  describe('confirm', () => {
    test('starts new job', () => {
      const startJob = jest.fn();
      const { getByText, getByLabelText } = setup({ startJob });
      const btn = getByText('Confirm');
      const confirm = getByLabelText('I understand these warnings', {
        exact: false,
      });

      expect(btn).toBeDisabled();

      fireEvent.click(confirm);

      expect(btn).not.toBeDisabled();

      fireEvent.click(btn);

      expect(startJob).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    test('closes modal', () => {
      const toggleModal = jest.fn();
      const { getByText } = setup({ toggleModal });
      fireEvent.click(getByText('Cancel'));

      expect(toggleModal).toHaveBeenCalledWith(false);
    });
  });
});
