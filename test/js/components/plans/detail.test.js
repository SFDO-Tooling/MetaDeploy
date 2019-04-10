import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux, storeWithApi } from './../../utils';

import { fetchVersion } from 'store/products/actions';
import { fetchPreflight } from 'store/plans/actions';
import PlanDetail from 'components/plans/detail';

jest.mock('store/products/actions');
jest.mock('store/plans/actions');

fetchVersion.mockReturnValue({ type: 'TEST' });
fetchPreflight.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  fetchVersion.mockClear();
  fetchPreflight.mockClear();
});

const defaultState = {
  products: [
    {
      id: 'p1',
      slug: 'product-1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
      image: null,
      most_recent_version: {
        id: 'v1',
        product: 'p1',
        label: '1.0.0',
        description: 'This is a test product version.',
        primary_plan: {
          id: 'plan-1',
          slug: 'my-plan',
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
          ],
          is_allowed: true,
        },
        secondary_plan: {
          id: 'plan-2',
          slug: 'other-plan',
          title: 'My Other Plan',
          preflight_message: '',
          steps: [{ id: 'step-5', name: 'My Other Step' }],
          is_allowed: true,
        },
        additional_plans: [
          {
            id: 'plan-3',
            slug: 'third-plan',
            title: 'My Third Plan',
            preflight_message: 'Third preflight text…',
            steps: [],
            is_allowed: true,
          },
          {
            id: 'plan-4',
            slug: 'fourth-plan',
            title: 'My Restricted Plan',
            preflight_message: null,
            steps: null,
            is_allowed: false,
            not_allowed_instructions: 'plan restricted',
          },
        ],
      },
      is_allowed: true,
    },
  ],
  preflights: {
    'plan-1': {
      status: 'complete',
      is_valid: true,
      error_count: 0,
      warning_count: 0,
      results: {
        'step-1': { status: 'optional' },
        'step-3': { status: 'skip' },
      },
      is_ready: true,
    },
  },
  user: { valid_token_for: 'foo', org_type: 'an org' },
  jobs: {},
  org: null,
};

describe('<PlanDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
      planSlug: 'my-plan',
    };
    const opts = { ...defaults, ...options };
    const { productSlug, versionLabel, planSlug, rerenderFn } = opts;
    const {
      getByText,
      queryByText,
      getByAltText,
      container,
      rerender,
    } = renderWithRedux(
      <MemoryRouter>
        <PlanDetail
          match={{ params: { productSlug, versionLabel, planSlug } }}
        />
      </MemoryRouter>,
      opts.initialState,
      storeWithApi,
      rerenderFn,
    );
    return { getByText, queryByText, getByAltText, container, rerender };
  };

  describe('insufficient permissions for user', () => {
    test('renders login button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          user: { valid_token_for: 'foo', org_type: null },
        },
      });

      expect(getByText('Log in with a different org')).toBeVisible();
    });
  });

  describe('installation is already running on org', () => {
    test('renders warning and disabled button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          org: {
            current_job: {
              id: '1',
              product_slug: 'product-1',
              version_label: '1.0.0',
              plan_slug: 'my-plan',
            },
            current_preflight: null,
          },
        },
      });

      expect(getByText('View the running installation')).toBeVisible();
      expect(getByText('Install')).toBeDisabled();
    });
  });

  describe('preflight is already running on org', () => {
    test('renders warning and disabled button', () => {
      const { getByText } = setup({
        initialState: {
          ...defaultState,
          org: { current_job: null, current_preflight: '1' },
        },
      });

      expect(
        getByText('A pre-install validation is currently running on this org.'),
      ).toBeVisible();
      expect(getByText('Install')).toBeDisabled();
    });
  });

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ initialState: { products: [] } });

      expect(getByText('list of all products')).toBeVisible();
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

  describe('unknown preflight', () => {
    test('fetches preflight', () => {
      setup({
        initialState: { ...defaultState, preflights: {} },
      });

      expect(fetchPreflight).toHaveBeenCalledWith('plan-1');
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

    describe('preflight is removed', () => {
      test('fetches preflight', () => {
        const { rerender } = setup();

        expect(fetchPreflight).not.toHaveBeenCalled();

        setup({
          planSlug: 'other-plan',
          rerenderFn: rerender,
        });

        expect(fetchPreflight).toHaveBeenCalledWith('plan-2');
      });
    });
  });

  test('renders primary_plan detail', () => {
    const { getByText } = setup();

    expect(getByText('Product 1, 1.0.0')).toBeVisible();
    expect(getByText('My Plan')).toBeVisible();
    expect(getByText('Preflight text…')).toBeVisible();
    expect(getByText('Step 1')).toBeVisible();
  });

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
                average_duration: '30',
              },
            },
          },
        ],
      },
    });

    expect(getByText('Average Install Time:')).toBeVisible();
    expect(getByText('30 seconds.')).toBeVisible();
  });

  test('renders preflight expiration warning', () => {
    const { getByText } = setup({
      initialState: {
        ...defaultState,
        org: { current_job: null, current_preflight: null },
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

    expect(getByText('Product 1, 1.0.0')).toBeVisible();
    expect(getByText('My Other Plan')).toBeVisible();
    expect(getByText('My Other Step')).toBeVisible();
  });

  test('renders additional_plan detail (no steps)', () => {
    const { getByText } = setup({
      planSlug: 'third-plan',
    });

    expect(getByText('Product 1, 1.0.0')).toBeVisible();
    expect(getByText('Third preflight text…')).toBeVisible();
  });

  describe('no plan', () => {
    test('renders <PlanNotFound />', () => {
      const { getByText } = setup({
        planSlug: 'nope',
      });

      expect(getByText('another plan')).toBeVisible();
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
