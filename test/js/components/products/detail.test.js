import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { renderWithRedux } from './../../utils';

import routes from 'utils/routes';
import {
  fetchAdditionalPlans,
  fetchPlan,
  fetchVersion,
} from 'store/products/actions';
import { ProductDetail, VersionDetail } from 'components/products/detail';

jest.mock('store/products/actions');

fetchPlan.mockReturnValue({ type: 'TEST' });
fetchAdditionalPlans.mockReturnValue({ type: 'TEST' });
fetchVersion.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  fetchPlan.mockClear();
  fetchAdditionalPlans.mockClear();
  fetchVersion.mockClear();
});

const defaultState = {
  products: [
    {
      id: 'p1',
      slug: 'product-1',
      old_slugs: ['old-slug'],
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
      image: 'http://foo.bar',
      most_recent_version: {
        id: 'v1',
        product: 'p1',
        label: '1.0.0',
        description: 'This is a test product version.',
        primary_plan: {
          id: 'plan-1',
          slug: 'my-plan',
          old_slugs: [],
          title: 'My Plan',
          is_listed: true,
          is_allowed: true,
          requires_preflight: true,
        },
        secondary_plan: {
          id: 'plan-2',
          slug: 'my-secondary-plan',
          old_slugs: [],
          title: 'My Secondary Plan',
          is_listed: true,
          is_allowed: true,
          requires_preflight: true,
        },
        additional_plans: {
          'my-additional-plan': {
            id: 'plan-3',
            slug: 'my-additional-plan',
            old_slugs: [],
            title: 'My Additional Plan',
            is_listed: true,
            is_allowed: true,
            requires_preflight: true,
          },
        },
        is_listed: true,
      },
      is_listed: true,
      is_allowed: true,
    },
  ],
  user: {},
};

describe('<ProductDetail />', () => {
  const setup = (initialState = defaultState, productSlug = 'product-1') => {
    const context = {};
    const { getByText } = renderWithRedux(
      <StaticRouter context={context}>
        <ProductDetail match={{ params: { productSlug } }} />
      </StaticRouter>,
      initialState,
    );
    return { getByText, context };
  };

  test('redirects to version_detail', () => {
    const { context } = setup();

    expect(context.action).toEqual('REPLACE');
    expect(context.url).toEqual(routes.version_detail('product-1', '1.0.0'));
  });

  describe('product has old_slug', () => {
    test('redirects to product_detail with new slug', () => {
      const { context } = setup(defaultState, 'old-slug');

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.product_detail('product-1'));
    });
  });

  describe('no most_recent_version', () => {
    test('renders <VersionNotFound />', () => {
      const { getByText } = setup({
        products: [{ ...defaultState.products[0], most_recent_version: null }],
      });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ products: [] });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('no productSlug', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup(defaultState, '');

      expect(getByText('list of all products')).toBeVisible();
    });
  });
});

describe('<VersionDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
    };
    const opts = Object.assign({}, defaults, options);
    const { productSlug, versionLabel, rerenderFn } = opts;
    const context = {};
    const { getByText, queryByText, getByAltText, rerender } = renderWithRedux(
      <StaticRouter context={context}>
        <VersionDetail
          match={{
            params: {
              productSlug,
              versionLabel,
            },
          }}
        />
      </StaticRouter>,
      opts.initialState,
      opts.customStore,
      rerenderFn,
    );
    return { getByText, queryByText, getByAltText, rerender, context };
  };

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ initialState: { products: [] } });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('product has old_slug', () => {
    test('redirects to version_detail with new slug', () => {
      const { context } = setup({ productSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.version_detail('product-1', '1.0.0'));
    });
  });

  test('fetches plans', () => {
    setup();

    expect(fetchAdditionalPlans).toHaveBeenCalledTimes(1);
  });

  describe('unknown version-or-plan', () => {
    describe('matches known plan', () => {
      test('redirects to plan_detail', () => {
        const { context } = setup({
          versionLabel: 'my-secondary-plan',
        });

        expect(context.action).toEqual('REPLACE');
        expect(context.url).toEqual(
          routes.plan_detail('product-1', '1.0.0', 'my-secondary-plan'),
        );
      });
    });

    describe('matches known not-plan', () => {
      test('fetches version', () => {
        const product = defaultState.products[0];
        setup({
          versionLabel: '2.0.0',
          initialState: {
            products: [
              {
                ...product,
                most_recent_version: {
                  ...product.most_recent_version,
                  additional_plans: {
                    '2.0.0': null,
                  },
                },
              },
            ],
          },
        });

        expect(fetchVersion).toHaveBeenCalledWith({
          product: 'p1',
          label: '2.0.0',
        });
      });
    });

    describe('does not match known plan', () => {
      test('fetches plan', () => {
        setup({ versionLabel: 'possible-plan' });

        expect(fetchPlan).toHaveBeenCalledWith({
          product: 'p1',
          version: 'v1',
          slug: 'possible-plan',
        });
      });
    });
  });

  describe('componentDidUpdate', () => {
    describe('version is unchanged', () => {
      test('does not fetch version', () => {
        const { rerender } = setup();

        expect(fetchVersion).not.toHaveBeenCalled();

        setup({ rerenderFn: rerender });

        expect(fetchVersion).not.toHaveBeenCalled();
      });
    });

    describe('version is changed', () => {
      test('fetches plan', () => {
        const { rerender } = setup({ versionLabel: '1.0.0' });

        expect(fetchPlan).not.toHaveBeenCalled();

        setup({
          versionLabel: '2.0.0',
          rerenderFn: rerender,
        });

        expect(fetchPlan).toHaveBeenCalledWith({
          product: 'p1',
          version: 'v1',
          slug: '2.0.0',
        });
      });

      test('fetches version', () => {
        const product = defaultState.products[0];
        const { rerender } = setup({
          versionLabel: '1.0.0',
          initialState: {
            products: [
              {
                ...product,
                most_recent_version: {
                  ...product.most_recent_version,
                  additional_plans: {
                    '2.0.0': null,
                  },
                },
              },
            ],
          },
        });

        expect(fetchVersion).not.toHaveBeenCalled();

        setup({
          versionLabel: '2.0.0',
          rerenderFn: rerender,
        });

        expect(fetchVersion).toHaveBeenCalledWith({
          product: 'p1',
          label: '2.0.0',
        });
      });
    });
  });

  describe('version is most_recent_version', () => {
    test('renders version detail', () => {
      const { getByText, getByAltText } = setup();

      expect(getByText('Product 1, 1.0.0')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(getByText('View Plan: My Plan')).toBeVisible();
      expect(getByText('View Plan: My Secondary Plan')).toBeVisible();
      expect(getByText('My Additional Plan')).toBeVisible();
      expect(getByAltText('Product 1')).toHaveAttribute(
        'src',
        'http://foo.bar',
      );
    });

    test('handles missing primary plan', () => {
      const product = defaultState.products[0];
      const { getByText, queryByText } = setup({
        initialState: {
          products: [
            {
              ...product,
              most_recent_version: {
                ...product.most_recent_version,
                primary_plan: {
                  ...product.most_recent_version.primary_plan,
                  is_listed: false,
                },
              },
            },
          ],
        },
      });

      expect(getByText('Product 1, 1.0.0')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(queryByText('View Plan: My Plan')).toBeNull();
      expect(getByText('View Plan: My Secondary Plan')).toBeVisible();
      expect(getByText('My Additional Plan')).toBeVisible();
    });

    test('handles missing secondary/additional plans', () => {
      const product = {
        id: 'p1',
        slug: 'product-1',
        old_slugs: [],
        title: 'Product 1',
        description: 'This is a test product.',
        category: 'salesforce',
        most_recent_version: {
          id: 'v1',
          product: 'p1',
          label: '1.0.0',
          description: 'This is a test product version.',
          primary_plan: {
            id: 'plan-1',
            slug: 'my-plan',
            old_slugs: [],
            title: 'My Plan',
            is_listed: true,
            is_allowed: true,
            requires_preflight: true,
          },
          secondary_plan: null,
          is_listed: true,
        },
        is_listed: true,
        is_allowed: true,
      };
      const { getByText, queryByText } = setup({
        initialState: { products: [product] },
      });

      expect(getByText('Product 1, 1.0.0')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(getByText('View Plan: My Plan')).toBeVisible();
      expect(queryByText('View Plan: My Secondary Plan')).toBeNull();
      expect(queryByText('My Additional Plan')).toBeNull();
    });

    test('handles missing primary/secondary plans', () => {
      const product = {
        id: 'p1',
        slug: 'product-1',
        old_slugs: [],
        title: 'Product 1',
        description: 'This is a test product.',
        category: 'salesforce',
        most_recent_version: {
          id: 'v1',
          product: 'p1',
          label: '1.0.0',
          description: 'This is a test product version.',
          primary_plan: null,
          secondary_plan: null,
          additional_plans: {
            'my-plan': {
              id: 'plan-1',
              slug: 'my-plan',
              old_slugs: [],
              title: 'My Plan',
              is_listed: true,
              is_allowed: true,
              requires_preflight: true,
            },
          },
          is_listed: true,
        },
        is_listed: true,
        is_allowed: true,
      };
      const { getByText, queryByText } = setup({
        initialState: { products: [product] },
      });

      expect(getByText('Product 1, 1.0.0')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(getByText('My Plan')).toBeVisible();
      expect(queryByText('Additional Plans')).toBeNull();
    });
  });

  describe('version is not most_recent_version', () => {
    const version = {
      id: 'v2',
      product: 'p1',
      label: '2.0.0',
      description: 'This is another test product version.',
      primary_plan: {
        id: 'plan-4',
        slug: 'my-plan-4',
        old_slugs: [],
        title: 'My Plan 4',
        is_listed: true,
        is_allowed: true,
        requires_preflight: true,
      },
      secondary_plan: null,
      is_listed: true,
    };
    const product = Object.assign({}, defaultState.products[0]);
    product.versions = { [version.label]: version };
    test('renders version detail', () => {
      const { getByText } = setup({
        initialState: { products: [product] },
        versionLabel: '2.0.0',
      });

      expect(getByText('Product 1, 2.0.0')).toBeVisible();
      expect(getByText('This is another test product version.')).toBeVisible();
      expect(getByText('View Plan: My Plan 4')).toBeVisible();
    });
  });

  describe('no version', () => {
    test('renders <VersionNotFound />', () => {
      const product = Object.assign({}, defaultState.products[0]);
      product.versions = { '2.0.0': null };
      product.most_recent_version.additional_plans['2.0.0'] = null;
      const { getByText } = setup({
        initialState: { products: [product] },
        versionLabel: '2.0.0',
      });

      expect(getByText('most recent version')).toBeVisible();
    });
  });

  describe('no version and no most_recent_version', () => {
    test('renders <VersionNotFound />', () => {
      const product = Object.assign({}, defaultState.products[0], {
        versions: { '2.0.0': null },
        most_recent_version: null,
      });
      const { getByText } = setup({
        initialState: { products: [product] },
        versionLabel: '2.0.0',
      });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('product is restricted', () => {
    test('renders <ProductNotAllowed />', () => {
      const { getByText } = setup({
        initialState: {
          products: [
            {
              ...defaultState.products[0],
              is_allowed: false,
              not_allowed_instructions: 'foobar',
              description: null,
            },
          ],
        },
      });

      expect(getByText('list of all products')).toBeVisible();
      expect(getByText('foobar')).toBeVisible();
    });

    test('renders <ProductNotAllowed /> without custom message', () => {
      const { getByText } = setup({
        initialState: {
          products: [
            {
              ...defaultState.products[0],
              is_allowed: false,
              not_allowed_instructions: null,
              description: null,
            },
          ],
          user: null,
        },
      });

      expect(getByText('list of all products')).toBeVisible();
      expect(getByText('log in')).toBeVisible();
    });
  });
});
