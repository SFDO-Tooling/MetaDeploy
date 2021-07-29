import { fireEvent } from '@testing-library/react';
import React from 'react';

import ShareModal from '@/js/components/jobs/shareModal';
import routes from '@/js/utils/routes';

import { render } from './../../utils';

describe('<ShareModal />', () => {
  const defaultJob = {
    id: 'job-1',
    is_public: false,
    user_can_edit: true,
    status: 'complete',
    results: {},
    product_slug: 'my-product',
    version_label: 'my-version',
    plan_slug: 'my-plan',
  };
  const defaultPlan = {
    id: 'plan-1',
    slug: 'my-plan',
    old_slugs: [],
    title: 'My Plan',
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
      },
      {
        id: 'step-2',
        name: 'Step 2',
      },
      {
        id: 'step-3',
        name: 'Step 3',
      },
      {
        id: 'step-4',
        name: 'Step 4',
      },
    ],
    requires_preflight: true,
    supported_orgs: 'Persistent',
  };

  const setup = (options) => {
    const defaults = {
      toggleModal: jest.fn(),
      updateJob: jest.fn(),
      job: defaultJob,
      plan: defaultPlan,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText, queryByText, baseElement } = render(
      <ShareModal
        isOpen={true}
        job={opts.job}
        plan={opts.plan}
        toggleModal={opts.toggleModal}
        updateJob={opts.updateJob}
      />,
    );
    return { getByLabelText, getByText, queryByText, baseElement };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'setTimeout');
  });

  describe('with error', () => {
    test('displays default error message', () => {
      const { getByText } = setup({
        job: { ...defaultJob, status: 'failed' },
      });

      expect(getByText('Resolve Installation Error')).toBeVisible();
      expect(getByText('Don’t panic', { exact: false })).toBeVisible();
    });

    test('displays custom error message', () => {
      const { getByText } = setup({
        job: { ...defaultJob, status: 'failed', error_message: 'Sorry!' },
      });

      expect(getByText('Resolve Installation Error')).toBeVisible();
      expect(getByText('Sorry!')).toBeVisible();
    });

    test('displays step error message', () => {
      const { getByText } = setup({
        job: {
          ...defaultJob,
          status: 'failed',
          results: {
            'not-a-step': [{ status: 'error', message: 'Not an error.' }],
            'step-1': [{ status: 'ok' }],
            'step-2': [{ status: 'error' }],
            'step-3': [{ status: 'error', message: 'Nope.' }],
          },
        },
      });

      expect(getByText('Resolve Installation Error')).toBeVisible();
      expect(getByText('Nope.')).toBeVisible();
    });
  });

  test('displays link', () => {
    const { getByText, baseElement } = setup({
      job: { ...defaultJob, user_can_edit: false },
    });
    const url = routes.job_detail(
      'my-product',
      'my-version',
      'my-plan',
      'job-1',
    );
    const input = baseElement.querySelector('#share-job-link');

    expect(getByText('Share Link to Installation Job')).toBeVisible();
    expect(getByText('Copy Link')).toBeVisible();
    expect(input).toBeVisible();
    expect(input.value).toEqual(`${window.location.origin}${url}`);
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
