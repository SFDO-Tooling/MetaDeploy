import { fireEvent } from '@testing-library/react';
import React from 'react';

import PreflightWarningModal from '@/js/components/plans/preflightWarningModal';

import { render } from './../../utils';

describe('<PreflightWarningModal />', () => {
  const defaultResults = {
    plan: [{ status: 'warn', message: 'This is a plan warning.' }],
    'step-1': [{ status: 'warn', message: 'This is a step warning.' }],
    'step-2': [{ status: 'warn' }],
    'step-3': undefined,
    'step-4': [{ status: 'warn', message: 'This is another step warning.' }],
  };
  const defaultSteps = [
    { id: 'step-1', name: 'Step 1' },
    { id: 'step-2', name: 'Step 2' },
    { id: 'step-3', name: 'Step 3' },
  ];
  const selectedSteps = new Set(['step-1', 'step-2', 'step-3']);

  const setup = (options) => {
    const defaults = {
      toggleModal: jest.fn(),
      startJob: jest.fn(),
      results: defaultResults,
      steps: defaultSteps,
      selectedSteps,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText } = render(
      <PreflightWarningModal
        isOpen={true}
        toggleModal={opts.toggleModal}
        startJob={opts.startJob}
        results={opts.results}
        steps={opts.steps}
        selectedSteps={opts.selectedSteps}
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
    test('starts new job and closes modal', () => {
      const toggleModal = jest.fn();
      const startJob = jest.fn();
      const { getByText, getByLabelText } = setup({ startJob, toggleModal });
      const btn = getByText('Confirm');
      const confirm = getByLabelText('I understand these warnings', {
        exact: false,
      });

      expect(btn).toBeDisabled();

      fireEvent.click(confirm);

      expect(btn).not.toBeDisabled();

      fireEvent.click(btn);

      expect(startJob).toHaveBeenCalled();
      expect(toggleModal).toHaveBeenCalledWith(false);
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
