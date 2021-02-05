import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import JobDetail from '@/components/jobs/detail';
import { fetchJob, requestCancelJob } from '@/store/jobs/actions';
import {
  fetchPlan,
  fetchProduct,
  fetchVersion,
} from '@/store/products/actions';
import { fetchScratchOrg } from '@/store/scratchOrgs/actions';
import routes from '@/utils/routes';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithApi,
} from './../../utils';

jest.mock('@/store/jobs/actions');
jest.mock('@/store/products/actions');
jest.mock('@/store/scratchOrgs/actions');

fetchScratchOrg.mockReturnValue({ type: 'TEST' });
fetchJob.mockReturnValue({ type: 'TEST' });
fetchPlan.mockReturnValue({ type: 'TEST' });
fetchProduct.mockReturnValue({ type: 'TEST' });
fetchVersion.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  fetchScratchOrg.mockClear();
  fetchJob.mockClear();
  fetchPlan.mockClear();
  fetchProduct.mockClear();
  fetchVersion.mockClear();
  requestCancelJob.mockClear();
});

const defaultState = {
  products: {
    products: [
      {
        id: 'p1',
        slug: 'product-1',
        old_slugs: ['old-product'],
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
            old_slugs: ['old-plan'],
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
          requires_preflight: true,
          supported_orgs: 'Persistent',
        },
      },
    ],
    notFound: [],
  },
  jobs: {
    'job-1': {
      id: 'job-1',
      org_id: '0x-org-id',
      creator: {
        username: 'test-user',
      },
      plan: 'plan-1',
      status: 'complete',
      steps: ['step-1', 'step-2', 'step-4'],
      results: { 'step-1': [{ status: 'ok' }] },
      org_name: 'Test Org',
      org_type: null,
      is_production_org: true,
      message: 'Congrats!',
      error_count: 0,
      user_can_edit: true,
      product_slug: 'product-1',
      version_label: '1.0.0',
      plan_slug: 'my-plan',
    },
  },
  user: null,
  scratchOrgs: {
    'plan-1': null,
  },
};

const scratchOrg = {
  plan: 'plan-1',
  org_id: '0x-org-id',
  status: 'complete',
  uuid: 'org-uuid',
  expires_at: new Date().toISOString(),
};

const scratchOrgJob = {
  ...defaultState.jobs['job-1'],
  creator: null,
};

describe('<JobDetail />', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      customStore: storeWithApi,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
      planSlug: 'my-plan',
      jobId: 'job-1',
    };
    const opts = { ...defaults, ...options };
    const {
      productSlug,
      versionLabel,
      planSlug,
      jobId,
      rerenderFn,
      customStore,
      initialState,
    } = opts;
    const context = {};
    const ui = (
      <StaticRouter context={context}>
        <JobDetail
          match={{ params: { productSlug, versionLabel, planSlug, jobId } }}
        />
      </StaticRouter>
    );
    if (rerenderFn) {
      return {
        ...reRenderWithRedux(
          ui,
          customStore || storeWithApi(initialState),
          rerenderFn,
        ),
        context,
      };
    }
    return { ...renderWithRedux(ui, initialState, customStore), context };
  };

  describe('unknown product', () => {
    test('fetches product', () => {
      setup({ productSlug: 'product-2' });

      expect(fetchProduct).toHaveBeenCalledWith({
        slug: 'product-2',
      });
    });
  });

  describe('unknown version', () => {
    test('fetches version', () => {
      setup({ versionLabel: '2.0.0' });

      expect(fetchVersion).toHaveBeenCalledWith({
        product: 'p1',
        label: '2.0.0',
      });
    });
  });

  describe('unknown plan', () => {
    test('fetches plan', () => {
      setup({ planSlug: 'other-plan' });

      expect(fetchPlan).toHaveBeenCalledWith({
        product: 'p1',
        version: 'v1',
        slug: 'other-plan',
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

  describe('unknown scratch org', () => {
    test('fetches org', () => {
      setup({
        initialState: {
          ...defaultState,
          jobs: { 'job-1': scratchOrgJob },
          scratchOrgs: {},
        },
      });

      expect(fetchScratchOrg).toHaveBeenCalledWith('plan-1');
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
      const { getByText, getAllByText } = setup({
        initialState: { ...defaultState, jobs: { nope: null } },
        jobId: 'nope',
      });

      expect(getByText('starting a new installation')).toBeVisible();
      expect(getAllByText('Log In')[1]).toBeVisible();
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
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            ...defaultState.jobs,
            'job-1': { ...defaultState.jobs['job-1'], plan: 'other-plan' },
          },
        },
      });

      expect(getByText('starting a new installation')).toBeVisible();
      expect(getAllByText('Log In')[1]).toBeVisible();
    });
  });

  describe('product has old_slug', () => {
    test('redirects to job_detail with new slug', () => {
      const { context } = setup({ productSlug: 'old-product' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.job_detail('product-1', '1.0.0', 'my-plan', 'job-1'),
      );
    });
  });

  describe('plan has old_slug', () => {
    test('redirects to job_detail with new slug', () => {
      const { context } = setup({ planSlug: 'old-plan' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.job_detail('product-1', '1.0.0', 'my-plan', 'job-1'),
      );
    });
  });

  describe('product and plan have old_slugs', () => {
    test('redirects to job_detail with new slug', () => {
      const { context } = setup({
        productSlug: 'old-product',
        planSlug: 'old-plan',
      });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.job_detail('product-1', '1.0.0', 'my-plan', 'job-1'),
      );
    });
  });

  describe('componentDidUpdate', () => {
    describe('product is changed', () => {
      test('fetches product', () => {
        const { rerender, store } = setup();

        expect(fetchProduct).not.toHaveBeenCalled();

        setup({
          productSlug: 'product-2',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchProduct).toHaveBeenCalledWith({
          slug: 'product-2',
        });
      });
    });

    describe('version is changed', () => {
      test('fetches version', () => {
        const { rerender, store } = setup();

        expect(fetchVersion).not.toHaveBeenCalled();

        setup({
          versionLabel: '2.0.0',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchVersion).toHaveBeenCalledWith({
          product: 'p1',
          label: '2.0.0',
        });
      });
    });

    describe('plan is changed', () => {
      test('fetches plan', () => {
        const { rerender, store } = setup();

        expect(fetchPlan).not.toHaveBeenCalled();

        setup({
          planSlug: 'other-plan',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchPlan).toHaveBeenCalledWith({
          product: 'p1',
          version: 'v1',
          slug: 'other-plan',
        });
      });
    });

    describe('job is removed', () => {
      test('fetches job', () => {
        const { rerender, store } = setup();

        expect(fetchJob).not.toHaveBeenCalled();

        setup({
          jobId: 'other-job',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchJob).toHaveBeenCalledWith({
          jobId: 'other-job',
          productSlug: 'product-1',
          versionLabel: '1.0.0',
          planSlug: 'my-plan',
        });
      });
    });

    describe('job fails', () => {
      test('opens modal', () => {
        const { getByText, queryByText, rerender } = setup();

        expect(queryByText('Resolve Installation Error')).toBeNull();

        setup({
          initialState: {
            ...defaultState,
            jobs: {
              ...defaultState.jobs,
              'job-1': { ...defaultState.jobs['job-1'], status: 'failed' },
            },
          },
          rerenderFn: rerender,
          customStore: false,
        });

        expect(getByText('Resolve Installation Error')).toBeVisible();
      });
    });

    describe('scratch org job completes', () => {
      test('opens modal', () => {
        const state = {
          ...defaultState,
          jobs: {
            'job-1': { ...scratchOrgJob, status: 'started' },
          },
          scratchOrgs: {
            'plan-1': scratchOrg,
          },
        };
        const { baseElement, getByText, queryByText, rerender } = setup({
          initialState: state,
        });

        expect(queryByText('Access Your Scratch Org')).toBeNull();

        setup({
          initialState: {
            ...state,
            jobs: {
              'job-1': { ...scratchOrgJob, status: 'complete' },
            },
          },
          rerenderFn: rerender,
          customStore: false,
        });
        const input = baseElement.querySelector('#share-job-link');
        const url = routes.job_detail('product-1', '1.0.0', 'my-plan', 'job-1');

        expect(getByText('Access Your Scratch Org')).toBeVisible();
        expect(input).toBeVisible();
        expect(input.value).toEqual(
          `${window.location.origin}${url}?scratch_org_id=${scratchOrg.uuid}`,
        );
      });
    });
  });

  describe('job complete', () => {
    test('renders average time', () => {
      const product = defaultState.products.products[0];
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          products: {
            ...defaultState.products,
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
        },
      });

      expect(getByText('Average Install Time: 2 minutes.')).toBeVisible();
    });

    test('renders job detail', () => {
      const { getByText, queryByText } = setup();

      expect(getByText('Product 1 1.0.0')).toBeVisible();
      expect(getByText('My Plan')).toBeVisible();
      expect(getByText('Installation Progress')).toBeVisible();
      expect(getByText('Congrats!')).toBeVisible();
      expect(getByText('test-user')).toBeVisible();
      expect(getByText('Test Org')).toBeVisible();
      expect(queryByText('Type:')).toBeNull();
    });

    test('renders job detail (hidden step)', () => {
      const { getByText, queryByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            'job-1': {
              ...defaultState.jobs['job-1'],
              results: {
                'step-4': [{ status: 'hide' }],
              },
            },
          },
        },
      });

      expect(getByText('Step 1')).toBeVisible();
      expect(queryByText('Step 4')).toBeNull();
    });

    test('renders job detail (no user, no steps)', () => {
      const { queryByText } = setup({
        initialState: {
          ...defaultState,
          products: {
            ...defaultState.products,
            products: [
              {
                ...defaultState.products.products[0],
                most_recent_version: {
                  ...defaultState.products.products[0].most_recent_version,
                  primary_plan: {
                    ...defaultState.products.products[0].most_recent_version
                      .primary_plan,
                    steps: null,
                  },
                },
              },
            ],
          },
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

      expect(getByText('View Installation Error Details & Link')).toBeVisible();
      expect(queryByText('Congrats!')).toBeNull();
    });
  });

  describe('share button click', () => {
    test('opens modal', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          jobs: {
            ...defaultState.jobs,
            'job-1': { ...defaultState.jobs['job-1'], status: 'started' },
          },
        },
      });
      fireEvent.click(getByText('Share Installation'));

      expect(getByText('Share Link to Installation Job')).toBeVisible();
    });
  });

  describe('cancel btn click', () => {
    test('calls requestCancelJob', () => {
      const canceled = Promise.resolve({});
      requestCancelJob.mockReturnValue(() => canceled);
      const id = 'job-1';
      const { getAllByText } = setup({
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
      fireEvent.click(getAllByText('Cancel Installation')[0]);

      expect.assertions(2);
      expect(requestCancelJob).toHaveBeenCalledWith('job-1');
      return canceled.then(() => {
        expect(getAllByText('Canceling Installation…')[0]).toBeVisible();
      });
    });
  });

  describe('scratch org job', () => {
    test('renders org expiration', () => {
      const initialState = {
        ...defaultState,
        jobs: {
          'job-1': { ...scratchOrgJob, status: 'complete' },
        },
        scratchOrgs: {
          'plan-1': scratchOrg,
        },
      };
      const { getByText } = setup({
        initialState,
      });

      expect(getByText('Scratch Org')).toBeVisible();
      expect(
        getByText('Your scratch org will expire on', { exact: false }),
      ).toBeVisible();
    });
  });
});
