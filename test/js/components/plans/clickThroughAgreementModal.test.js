import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import ClickThroughAgreementModal from 'components/plans/clickThroughAgreementModal';

describe('<ClickThroughAgreementModal />', () => {
  const setup = options => {
    const defaults = {
      toggleModal: jest.fn(),
      startJob: jest.fn(),
      text: 'Please and thank you.',
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText } = render(
      <ClickThroughAgreementModal
        isOpen={true}
        toggleModal={opts.toggleModal}
        startJob={opts.startJob}
        text={opts.text}
      />,
    );
    return { getByLabelText, getByText };
  };

  test('displays text', () => {
    const { getByLabelText, getByText } = setup();

    expect(getByText('Product Terms of Use and Licenses')).toBeVisible();
    expect(getByText('Please and thank you.')).toBeVisible();
    expect(
      getByLabelText('confirm I have read and agree to', { exact: false }),
    ).toBeVisible();
  });

  describe('confirm', () => {
    test('starts new job', () => {
      const startJob = jest.fn();
      const { getByText, getByLabelText } = setup({ startJob });
      const btn = getByText('Confirm');
      const confirm = getByLabelText('confirm I have read and agree to', {
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
