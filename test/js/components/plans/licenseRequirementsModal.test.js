import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import LicenseRequirementsModal from 'components/plans/licenseRequirementsModal';

describe('<LicenseRequirementsModal />', () => {
  const setup = options => {
    const defaults = {
      toggleModal: jest.fn(),
      startJob: jest.fn(),
      text: 'Please and thank you.',
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText } = render(
      <LicenseRequirementsModal
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

    expect(getByText('License Requirements', { exact: false })).toBeVisible();
    expect(getByText('Please and thank you.')).toBeVisible();
    expect(
      getByLabelText('continue with installation', { exact: false }),
    ).toBeVisible();
  });

  describe('confirm', () => {
    test('starts new job', () => {
      const startJob = jest.fn();
      const { getByText, getByLabelText } = setup({ startJob });
      const btn = getByText('Confirm');
      const confirm = getByLabelText('continue with installation', {
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
