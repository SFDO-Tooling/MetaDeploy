import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import ShareModal from 'components/jobs/shareModal';

describe('<ShareModal />', () => {
  const defaultJob = {
    id: 'job-1',
    is_public: false,
    user_can_edit: true,
  };

  const setup = options => {
    const defaults = {
      toggleModal: jest.fn(),
      updateJob: jest.fn(),
      job: defaultJob,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText, queryByText, baseElement } = render(
      <ShareModal
        isOpen={true}
        job={opts.job}
        toggleModal={opts.toggleModal}
        updateJob={opts.updateJob}
      />,
    );
    return { getByLabelText, getByText, queryByText, baseElement };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('displays link', () => {
    const { getByText, baseElement } = setup({
      job: { ...defaultJob, user_can_edit: false },
    });

    const input = baseElement.querySelector('#share-job-link');

    expect(getByText('Share Link to Installation Job')).toBeVisible();
    expect(getByText('Copy Link')).toBeVisible();
    expect(input).toBeVisible();
    expect(input.value).toEqual(window.location.href);
  });

  describe('copy link', () => {
    beforeAll(() => {
      document.execCommand = jest.fn();
    });

    test('copies link to clipboard', () => {
      const { getByText, queryByText } = setup();
      fireEvent.click(getByText('Copy Link'));

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(getByText('Copied to clipboard')).toBeVisible();
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

      jest.runAllTimers();

      expect(queryByText('Copied to clipboard')).toBeNull();
    });
  });

  describe('radio change', () => {
    test('calls updateJob', () => {
      const updateJob = jest.fn();
      const { getByLabelText } = setup({ updateJob });
      fireEvent.click(
        getByLabelText('Anyone with the link can view this installation job.'),
      );

      expect(updateJob).toHaveBeenCalledWith({
        id: 'job-1',
        is_public: 'true',
      });
    });
  });

  describe('close', () => {
    test('closes modal', () => {
      const toggleModal = jest.fn();
      const { baseElement } = setup({ toggleModal });
      fireEvent.click(baseElement.querySelector('button[title="Close"]'));

      expect(toggleModal).toHaveBeenCalledWith(false);
    });
  });
});
