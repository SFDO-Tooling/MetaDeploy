import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import PreflightWarningModal from 'components/plans/preflightWarningModal';

describe('<PreflightWarningModal />', () => {
  const defaultResults = {
    plan: [{ status: 'warn', message: 'This is a plan warning.' }],
    'step-1': [{ status: 'warn', message: 'This is a step warning.' }],
    'step-2': [{ status: 'warn' }],
    'step-3': undefined,
  };
  const defaultStepNames = new Map([
    ['step-1', 'Step 1'],
    ['step-2', 'Step 2'],
    ['step-3', 'Step 3'],
  ]);

  const setup = options => {
    const defaults = {
      toggleModal: jest.fn(),
      startJob: jest.fn(),
      results: defaultResults,
      stepNames: defaultStepNames,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText, getAllByLabelText } = render(
      <PreflightWarningModal
        isOpen={true}
        toggleModal={opts.toggleModal}
        startJob={opts.startJob}
        results={opts.results}
        stepNames={opts.stepNames}
      />,
    );
    return { getByLabelText, getByText, getAllByLabelText };
  };

  test('displays warning messages', () => {
    const { getByLabelText, getByText } = setup();

    expect(getByText('Please Confirm')).toBeVisible();
    expect(getByText('This is a plan warning.')).toBeVisible();
    expect(getByText('This is a step warning.')).toBeVisible();
    expect(getByLabelText('I understand.')).toBeVisible();
    expect(getByText('Confirm')).toBeDisabled();
  });

  test('enables "Confirm" btn after all warnings are checked', () => {
    const { getAllByLabelText, getByText } = setup();
    const btn = getByText('Confirm');
    const checkboxes = getAllByLabelText('I understand.');
    const planCheckbox = checkboxes[0];
    const stepCheckbox = checkboxes[1];

    expect(btn).toBeDisabled();

    fireEvent.click(planCheckbox);

    expect(btn).toBeDisabled();

    fireEvent.click(stepCheckbox);

    expect(btn).not.toBeDisabled();

    fireEvent.click(planCheckbox);

    expect(btn).toBeDisabled();
  });

  describe('confirm', () => {
    test('starts new job', () => {
      const startJob = jest.fn();
      const { getByText, getAllByLabelText } = setup({ startJob });
      const btn = getByText('Confirm');
      const checkboxes = getAllByLabelText('I understand.');
      const planCheckbox = checkboxes[0];
      const stepCheckbox = checkboxes[1];
      fireEvent.click(planCheckbox);
      fireEvent.click(stepCheckbox);
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
