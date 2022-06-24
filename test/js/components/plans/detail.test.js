import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import PlanDetail from '@/js/components/plans/detail';
import { fetchPreflight } from '@/js/store/plans/actions';
import {
  fetchPlan,
  fetchProduct,
  fetchVersion,
} from '@/js/store/products/actions';
import {
  fetchScratchOrg,
  spinScratchOrg,
} from '@/js/store/scratchOrgs/actions';
import routes from '@/js/utils/routes';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithApi,
} from './../../utils';

jest.mock('@/js/store/products/actions');
jest.mock('@/js/store/plans/actions');
jest.mock('@/js/store/scratchOrgs/actions');

fetchPlan.mockReturnValue({ type: 'TEST' });
fetchPreflight.mockReturnValue({ type: 'TEST' });
fetchProduct.mockReturnValue({ type: 'TEST' });
fetchVersion.mockReturnValue({ type: 'TEST' });
fetchScratchOrg.mockReturnValue({ type: 'TEST' });
spinScratchOrg.mockReturnValue({ type: 'TEST', payload: 'abc123' });

afterEach(() => {
  fetchPlan.mockClear();
  fetchPreflight.mockClear();
  fetchProduct.mockClear();
  fetchVersion.mockClear();
  fetchScratchOrg.mockClear();
  spinScratchOrg.mockClear();
});

const defaultState = {
  products: {
    products: [
      {
        id: 'p1',
        slug: 'product-1',
        old_slugs: ['old-product'],
        title: 'Product 1',
        description: 'This is a test product.',
        category: 'salesforce',
        image: null,
        click_through_agreement: '<p>Accept these terms, please</p>',
        most_recent_version: {
          id: 'v1',
          product: 'p1',
          label: '1.0.0',
          created_at: '2019-10-31T00:00:00.000000Z',
          description: 'This is a test product version.',
          primary_plan: {
            id: 'plan-1',
            slug: 'my-plan',
            old_slugs: ['old-plan'],
            title: 'My Plan',
            preflight_message: 'Preflight text…',
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
              {
                id: 'step-5',
                name: 'Step 5',
                is_required: false,
                is_recommended: false,
              },
            ],
            is_allowed: true,
            requires_preflight: true,
            supported_orgs: 'Both',
          },
          secondary_plan: {
            id: 'plan-2',
            slug: 'other-plan',
            old_slugs: [],
            title: 'My Other Plan',
            preflight_message: '',
            steps: [{ id: 'step-5', name: 'My Other Step' }],
            requires_preflight: true,
            is_allowed: true,
            supported_orgs: 'Both',
          },
          additional_plans: {
            'third-plan': {
              id: 'plan-3',
              slug: 'third-plan',
              old_slugs: [],
              title: 'My Third Plan',
              preflight_message: 'Third preflight text…',
              steps: [],
              is_allowed: true,
              requires_preflight: true,
              supported_orgs: 'Persistent',
            },
            'fourth-plan': {
              id: 'plan-4',
              slug: 'fourth-plan',
              old_slugs: [],
              title: 'My Restricted Plan',
              preflight_message: null,
              steps: null,
              is_allowed: false,
              requires_preflight: true,
              not_allowed_instructions: 'plan restricted',
              supported_orgs: 'Persistent',
            },
          },
        },
        is_allowed: true,
      },
    ],
    notFound: [],
  },
  preflights: {
    'plan-1': {
      status: 'complete',
      is_valid: true,
      error_count: 0,
      warning_count: 0,
      results: {
        'step-1': [{ status: 'optional' }],
        'step-3': [{ status: 'skip' }],
        'step-5': [{ status: 'hide' }],
      },
      is_ready: true,
    },
  },
  user: { valid_token_for: 'foo', org_type: 'an org' },
  jobs: {},
  org: null,
  scratchOrgs: {
    'plan-1': null,
  },
};

describe('<PlanDetail />', () => {
  const setup = (options) => {
    const defaults = {
      initialState: defaultState,
      customStore: storeWithApi,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
      planSlug: 'my-plan',
    };
    const opts = { ...defaults, ...options };
    const {
      productSlug,
      versionLabel,
      planSlug,
      rerenderFn,
      customStore,
      initialState,
    } = opts;
    const context = {};
    const ui = (
      <StaticRouter context={context}>
        <PlanDetail
          match={{ params: { productSlug, versionLabel, planSlug } }}
        />
      </StaticRouter>
    );
    if (rerenderFn && customStore) {
      return { ...reRenderWithRedux(ui, customStore, rerenderFn), context };
    }
    return { ...renderWithRedux(ui, initialState, customStore), context };
  };

  beforeAll(() => {
    window.GLOBALS.SCRATCH_ORGS_AVAILABLE = true;
  });

  afterAll(() => {
    window.GLOBALS = {};
  });

  describe('insufficient permissions for user', () => {
    test('renders login button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          user: { valid_token_for: 'foo', org_type: null },
        },
      });

      expect(
        getByText('you don’t have permissions', { exact: false }),
      ).toBeVisible();
    });
  });

  describe('installation is already running on org', () => {
    test('renders warning and disabled button', () => {
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            'org-id': {
              org_id: 'org-id',
              current_job: {
                id: '1',
                product_slug: 'product-1',
                version_label: '1.0.0',
                plan_slug: 'my-plan',
              },
              current_preflight: null,
            },
          },
        },
      });

      expect(getByText('View the running installation.')).toBeVisible();
      expect(getAllByText('Install')[0]).toBeDisabled();
    });
  });

  describe('preflight is already running on org', () => {
    test('renders warning and disabled button', () => {
      const { getByText, getAllByText } = setup({
        initialState: {
          ...defaultState,
          orgs: {
            'org-id': {
              org_id: 'org-id',
              current_job: null,
              current_preflight: '1',
            },
          },
        },
      });

      expect(
        getByText('A pre-install validation is currently running on this org.'),
      ).toBeVisible();
      expect(getAllByText('Install')[0]).toBeDisabled();
    });
  });

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({
        initialState: { products: { products: [], notFound: ['product-1'] } },
      });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('unknown product', () => {
    test('fetches product', () => {
      setup({ productSlug: 'other-product' });

      expect(fetchProduct).toHaveBeenCalledWith({
        slug: 'other-product',
      });
    });
  });

  describe('product has old_slug', () => {
    test('redirects to plan_detail with new slug', () => {
      const { context } = setup({ productSlug: 'old-product' });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'my-plan'),
      );
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

  describe('not most_recent_version', () => {
    test('renders warning', () => {
      const product = defaultState.products.products[0];
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          products: {
            ...defaultState.products,
            products: [
              {
                ...product,
                versions: {
                  '2.0.0': {
                    id: 'v2',
                    product: 'p1',
                    label: '2.0.0',
                    created_at: '2019-01-01T00:00:00.000000Z',
                    primary_plan: {
                      id: 'plan-2',
                      slug: 'my-other-plan',
                      old_slugs: [],
                      title: 'My Other Plan',
                      steps: [],
                      is_allowed: true,
                    },
                  },
                },
              },
            ],
          },
        },
        versionLabel: '2.0.0',
        planSlug: 'my-other-plan',
      });

      expect(
        getByText('This is not the most recent version of this product.'),
      ).toBeVisible();
    });
  });

  describe('unknown preflight', () => {
    test('fetches preflight', () => {
      setup({
        initialState: { ...defaultState, preflights: {} },
      });

      expect(fetchPreflight).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('componentDidUpdate', () => {
    describe('product is changed', () => {
      test('fetches product', () => {
        const { rerender, store } = setup();

        expect(fetchProduct).not.toHaveBeenCalled();

        setup({
          productSlug: 'other-product',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchProduct).toHaveBeenCalledWith({
          slug: 'other-product',
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

    describe('plan changes', () => {
      test('fetches preflight', () => {
        const { rerender, store } = setup();

        expect(fetchPreflight).not.toHaveBeenCalled();

        setup({
          planSlug: 'other-plan',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchPreflight).toHaveBeenCalledWith('plan-2');
      });

      test('fetches scratch org', () => {
        const { rerender, store } = setup();

        expect(fetchScratchOrg).not.toHaveBeenCalled();

        setup({
          planSlug: 'other-plan',
          rerenderFn: rerender,
          customStore: store,
        });

        expect(fetchScratchOrg).toHaveBeenCalledWith('plan-2');
      });
    });
  });

  test('renders primary_plan detail', () => {
    const { getByText } = setup();

    expect(getByText('Product 1 1.0.0')).toBeVisible();
    expect(getByText('My Plan')).toBeVisible();
    expect(getByText('Preflight text…')).toBeVisible();
    expect(getByText('Step 1')).toBeVisible();
  });

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
                  average_duration: '30',
                },
              },
            },
          ],
        },
      },
    });

    expect(getByText('Average Install Time: 30 seconds.')).toBeVisible();
  });

  test('renders preflight expiration warning', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        orgs: {
          'org-id': {
            org_id: 'org-id',
            current_job: null,
            current_preflight: null,
          },
        },
      },
    });

    expect(
      getByText('not run within 10 minutes', {
        exact: false,
      }),
    ).toBeVisible();
  });

  test('renders secondary_plan detail (no preflight)', () => {
    const { getByText } = setup({
      planSlug: 'other-plan',
    });

    expect(getByText('Product 1 1.0.0')).toBeVisible();
    expect(getByText('My Other Plan')).toBeVisible();
    expect(getByText('My Other Step')).toBeVisible();
  });

  test('renders additional_plan detail (no steps)', () => {
    const { getByText } = setup({
      planSlug: 'third-plan',
    });

    expect(getByText('Product 1 1.0.0')).toBeVisible();
    expect(getByText('Third preflight text…')).toBeVisible();
  });

  describe('unknown plan', () => {
    test('fetches plan', () => {
      setup({ planSlug: 'possibly' });

      expect(fetchPlan).toHaveBeenCalledWith({
        product: 'p1',
        version: 'v1',
        slug: 'possibly',
      });
    });
  });

  describe('no plan', () => {
    test('renders <PlanNotFound />', () => {
      const product = defaultState.products.products[0];
      const { getByText } = setup({
        planSlug: 'nope',
        initialState: {
          ...defaultState,
          products: {
            ...defaultState.products,
            products: [
              {
                ...product,
                most_recent_version: {
                  ...product.most_recent_version,
                  additional_plans: {
                    ...product.most_recent_version.additional_plans,
                    nope: null,
                  },
                },
              },
            ],
          },
        },
      });

      expect(getByText('another plan')).toBeVisible();
    });
  });

  describe('plan has old_slug', () => {
    test('redirects to plan_detail with new slug', () => {
      const { context } = setup({ planSlug: 'old-plan' });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'my-plan'),
      );
    });
  });

  describe('product and plan have old_slugs', () => {
    test('redirects to plan_detail with new slug', () => {
      const { context } = setup({
        productSlug: 'old-product',
        planSlug: 'old-plan',
      });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'my-plan'),
      );
    });
  });

  describe('plan is restricted', () => {
    test('renders <PlanNotAllowed />', () => {
      const { getByText } = setup({
        planSlug: 'fourth-plan',
      });

      expect(getByText('another plan')).toBeVisible();
      expect(getByText('plan restricted')).toBeVisible();
    });
  });

  describe('handleStepsChange', () => {
    test('updates checkbox', () => {
      const { container } = setup();
      const checkbox1 = container.querySelector('#step-step-1');
      const checkbox4 = container.querySelector('#step-step-4');

      expect(checkbox1.checked).toBe(true);
      expect(checkbox4.checked).toBe(false);

      fireEvent.click(checkbox4);

      expect(checkbox4.checked).toBe(true);
    });
  });
});
