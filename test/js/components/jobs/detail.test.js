import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux, storeWithApi } from './../../utils';

import { fetchJob, requestCancelJob } from 'store/jobs/actions';
import { fetchVersion } from 'store/products/actions';
import JobDetail from 'components/jobs/detail';

jest.mock('store/jobs/actions');
jest.mock('store/products/actions');

fetchVersion.mockReturnValue({ type: 'TEST' });
fetchJob.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  fetchVersion.mockClear();
  fetchJob.mockClear();
  requestCancelJob.mockClear();
});

const defaultState = {
  products: [
    {
      id: 'p1',
      slug: 'product-1',
      title: 'Product 1',
      category: 'salesforce',
      image: null,
      most_recent_version: {
        id: 'v1',
        product: 'p1',
        label: '1.0.0',
        primary_plan: {
          id: 'plan-1',
          slug: 'my-plan',
          title: 'My Plan',
          steps: [
            {
              id: 'step-1',
              name: 'Step 1',
              is_required: true,
              is_recommended: true,
            },
            {
              id: 'step-2',
              name: 'Step 2',
              is_required: true,
              is_recommended: false,
            },
            {
              id: 'step-3',
              name: 'Step 3',
              is_required: false,
              is_recommended: true,
            },
            {
              id: 'step-4',
              name: 'Step 4',
              is_required: false,
              is_recommended: false,
            },
          ],
        },
        secondary_plan: null,
        additional_plans: [],
      },
    },
  ],
  jobs: {
    'job-1': {
      id: 'job-1',
      creator: {
        username: 'test-user',
      },
      plan: 'plan-1',
      status: 'complete',
      steps: ['step-1', 'step-2', 'step-4'],
      results: { 'step-1': [{ status: 'ok' }] },
      org_name: 'Test Org',
      org_type: null,
      message: 'Congrats!',
      error_count: 0,
    },
  },
  user: null,
};

describe('<JobDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
      planSlug: 'my-plan',
      jobId: 'job-1',
    };
    const opts = { ...defaults, ...options };
    const { productSlug, versionLabel, planSlug, jobId, rerenderFn } = opts;
    const {
      getByText,
      queryByText,
      getByAltText,
      container,
      rerender,
    } = renderWithRedux(
      <MemoryRouter>
        <JobDetail
          match={{ params: { productSlug, versionLabel, planSlug, jobId } }}
        />
      </MemoryRouter>,
      opts.initialState,
      storeWithApi,
      rerenderFn,
    );
    return { getByText, queryByText, getByAltText, container, rerender };
  };

  describe('unknown version', () => {
    test('fetches version', () => {
      setup({ versionLabel: '2.0.0' });

      expect(fetchVersion).toHaveBeenCalledWith({
        product: 'p1',
        label: '2.0.0',
      });
    });
  });

  describe('unknown job', () => {
    test('fetches job', () => {
      setup({
        initialState: { ...defaultState, jobs: {} },
      });

      expect(fetchJob).toHaveBeenCalledWith({
        jobId: 'job-1',
        productSlug: 'product-1',
        versionLabel: '1.0.0',
        planSlug: 'my-plan',
      });
    });
  });

  describe('no jobId', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({
        jobId: '',
      });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('no job', () => {
    test('renders <JobNotFound />', () => {
      const { getByText } = setup({
        initialState: { ...defaultState, jobs: { nope: null } },
        jobId: 'nope',
      });

      expect(getByText('starting a new installation')).toBeVisible();
      expect(getByText('Log In')).toBeVisible();
    });

    test('renders "Log In With a Different Org" dropdown', () => {
      const { getByText } = setup({
        initialState: { ...defaultState, jobs: { nope: null }, user: {} },
        jobId: 'nope',
      });

      expect(getByText('starting a new installation')).toBeVisible();
      expect(getByText('Log In With a Different Org')).toBeVisible();
    });
  });

  describe('job does not match plan', () => {
    test('renders <JobNotFound />', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            ...defaultState.jobs,
            'job-1': { ...defaultState.jobs['job-1'], plan: 'other-plan' },
          },
        },
      });

      expect(getByText('starting a new installation')).toBeVisible();
      expect(getByText('Log In')).toBeVisible();
    });
  });

  describe('componentDidUpdate', () => {
    describe('version is removed', () => {
      test('fetches version', () => {
        const { rerender } = setup();

        expect(fetchVersion).not.toHaveBeenCalled();

        setup({ versionLabel: '2.0.0', rerenderFn: rerender });

        expect(fetchVersion).toHaveBeenCalledWith({
          product: 'p1',
          label: '2.0.0',
        });
      });
    });

    describe('job is removed', () => {
      test('fetches job', () => {
        const { rerender } = setup();

        expect(fetchJob).not.toHaveBeenCalled();

        setup({
          jobId: 'other-job',
          rerenderFn: rerender,
        });

        expect(fetchJob).toHaveBeenCalledWith({
          jobId: 'other-job',
          productSlug: 'product-1',
          versionLabel: '1.0.0',
          planSlug: 'my-plan',
        });
      });
    });
  });

  describe('job complete', () => {
    test('renders average time', () => {
      const product = defaultState.products[0];
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          products: [
            {
              ...product,
              most_recent_version: {
                ...product.most_recent_version,
                primary_plan: {
                  ...product.most_recent_version.primary_plan,
                  average_duration: '119.999',
                },
              },
            },
          ],
        },
      });

      expect(getByText('Average Install Time:')).toBeVisible();
      expect(getByText('2 minutes.')).toBeVisible();
    });

    test('renders job detail', () => {
      const { getByText, queryByText } = setup();

      expect(getByText('Product 1, 1.0.0')).toBeVisible();
      expect(getByText('My Plan')).toBeVisible();
      expect(getByText('Installation Progress')).toBeVisible();
      expect(getByText('Congrats!')).toBeVisible();
      expect(getByText('test-user')).toBeVisible();
      expect(getByText('Test Org')).toBeVisible();
      expect(queryByText('Type:')).toBeNull();
    });

    test('renders job detail (no user, no steps)', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          products: [
            {
              ...defaultState.products[0],
              most_recent_version: {
                ...defaultState.products[0].most_recent_version,
                primary_plan: {
                  ...defaultState.products[0].most_recent_version.primary_plan,
                  steps: [],
                },
              },
            },
          ],
          jobs: {
            'job-1': {
              ...defaultState.jobs['job-1'],
              creator: null,
              org_name: null,
              org_type: null,
              error_count: 1,
            },
          },
        },
      });

      expect(queryByText('test-user')).toBeNull();
      expect(queryByText('Test Org')).toBeNull();
      expect(queryByText('Type:')).toBeNull();
    });

    test('renders job detail (no username, no org_name)', () => {
      const { getByText, queryByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            'job-1': {
              ...defaultState.jobs['job-1'],
              creator: null,
              org_name: null,
              org_type: 'Org Type',
            },
          },
        },
      });

      expect(queryByText('test-user')).toBeNull();
      expect(queryByText('Test Org')).toBeNull();
      expect(getByText('Org Type')).toBeVisible();
    });
  });

  describe('job failed', () => {
    test('renders job failed msg', () => {
      const { getByText, queryByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            'job-1': {
              ...defaultState.jobs['job-1'],
              status: 'failed',
            },
          },
        },
      });

      expect(
        getByText('Share the link to this installation job'),
      ).toBeVisible();
      expect(getByText('Power of Us Hub')).toBeVisible();
      expect(queryByText('Congrats!')).toBeNull();
    });
  });

  describe('share button click', () => {
    test('opens modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Share Installation'));

      expect(getByText('Share Link to Installation Job')).toBeVisible();
    });
  });

  describe('cancel btn click', () => {
    test('calls requestCancelJob', () => {
      const canceled = Promise.resolve({});
      requestCancelJob.mockReturnValue(() => canceled);
      const id = 'job-1';
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          user: { is_staff: true },
          jobs: {
            [id]: {
              ...defaultState.jobs[id],
              status: 'started',
            },
          },
        },
      });
      fireEvent.click(getByText('Cancel Installation'));

      expect.assertions(2);
      expect(requestCancelJob).toHaveBeenCalledWith('job-1');
      return canceled.then(() => {
        expect(getByText('Canceling Installation…')).toBeVisible();
      });
    });
  });
});
