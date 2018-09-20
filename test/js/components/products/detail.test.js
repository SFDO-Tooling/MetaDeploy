import React from 'react';
import fetchMock from 'fetch-mock';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux, storeWithApi } from './../../utils';

import routes from 'utils/routes';
import { addUrlParams } from 'utils/api';

import { ProductDetail, VersionDetail } from 'components/products/detail';

const defaultState = {
  products: [
    {
      id: 1,
      slug: 'product-1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
      image: 'http://foo.bar',
      most_recent_version: {
        id: 1,
        product: 1,
        label: '1.0.0',
        description: 'This is a test product version.',
        primary_plan: {
          id: 1,
          slug: 'my-plan',
          title: 'My Plan',
        },
        secondary_plan: {
          id: 2,
          slug: 'my-secondary-plan',
          title: 'My Secondary Plan',
        },
        additional_plans: [
          {
            id: 3,
            slug: 'my-additional-plan',
            title: 'My Additional Plan',
          },
        ],
      },
    },
  ],
};

describe('<ProductDetail />', () => {
  const setup = (initialState = defaultState, productSlug = 'product-1') => {
    renderWithRedux(
      <MemoryRouter>
        <ProductDetail match={{ params: { productSlug } }} />
      </MemoryRouter>,
      initialState,
    );
  };

  test('redirects to version_detail', () => {
    jest.spyOn(routes, 'version_detail');
    setup();

    expect(routes.version_detail).toHaveBeenCalledTimes(1);
    expect(routes.version_detail).toHaveBeenCalledWith('product-1', '1.0.0');
  });

  test('redirects to products_list if no product found with slug', () => {
    jest.spyOn(routes, 'product_list');
    setup({ products: [] });

    expect(routes.product_list).toHaveBeenCalledTimes(1);
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
    const { productSlug, versionLabel } = opts;
    const { getByText, queryByText, getByAltText } = renderWithRedux(
      <MemoryRouter>
        <VersionDetail match={{ params: { productSlug, versionLabel } }} />
      </MemoryRouter>,
      opts.initialState,
      opts.customStore,
    );
    return { getByText, queryByText, getByAltText };
  };

  test('redirects to products_list if no product found with slug', () => {
    jest.spyOn(routes, 'product_list');
    setup({ initialState: { products: [] } });

    expect(routes.product_list).toHaveBeenCalledTimes(1);
  });

  describe('version is most_recent_version', () => {
    test('renders version detail', () => {
      const { getByText, getByAltText } = setup();

      expect(getByText('Product 1')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(getByText('My Plan')).toBeVisible();
      expect(getByText('My Secondary Plan')).toBeVisible();
      expect(getByText('My Additional Plan')).toBeVisible();
      expect(getByAltText('Product 1')).toHaveAttribute(
        'src',
        'http://foo.bar',
      );
    });

    test('handles missing secondary/additional plans', () => {
      const product = {
        id: 1,
        slug: 'product-1',
        title: 'Product 1',
        description: 'This is a test product.',
        category: 'salesforce',
        most_recent_version: {
          id: 1,
          product: 1,
          label: '1.0.0',
          description: 'This is a test product version.',
          primary_plan: {
            id: 1,
            slug: 'my-plan',
            title: 'My Plan',
          },
          secondary_plan: null,
          additional_plans: [],
        },
      };
      const { getByText, queryByText } = setup({
        initialState: { products: [product] },
      });

      expect(getByText('Product 1')).toBeVisible();
      expect(getByText('This is a test product version.')).toBeVisible();
      expect(getByText('My Plan')).toBeVisible();
      expect(queryByText('My Secondary Plan')).toBeNull();
      expect(queryByText('My Additional Plan')).toBeNull();
    });
  });

  describe('version is not most_recent_version', () => {
    const version = {
      id: 2,
      product: 1,
      label: '2.0.0',
      description: 'This is another test product version.',
      primary_plan: {
        id: 4,
        slug: 'my-plan-4',
        title: 'My Plan 4',
      },
      secondary_plan: null,
      additional_plans: [],
    };
    const product = Object.assign({}, defaultState.products[0]);
    product.versions = { [version.label]: version };

    test('renders version detail', () => {
      const { getByText } = setup({
        initialState: { products: [product] },
        versionLabel: '2.0.0',
      });

      expect(getByText('Product 1')).toBeVisible();
      expect(getByText('This is another test product version.')).toBeVisible();
      expect(getByText('My Plan 4')).toBeVisible();
    });
  });

  describe('version not yet fetched, and version is not found', () => {
    test('GETs product version from api', () => {
      const url = addUrlParams(window.api_urls.version_list(), {
        product: 1,
        label: '2.0.0',
      });
      fetchMock.spy();

      const { getByText, queryByText } = setup({
        versionLabel: '2.0.0',
        customStore: storeWithApi,
      });

      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('Loading...')).toBeVisible();
      expect(fetchMock.called(url)).toBe(true);
    });
  });

  describe('version already fetched, and version is not found', () => {
    const product = Object.assign({}, defaultState.products[0]);
    product.versions = { '2.0.0': null };

    test('redirects to product_detail', () => {
      jest.spyOn(routes, 'product_detail');
      setup({
        initialState: { products: [product] },
        versionLabel: '2.0.0',
      });

      expect(routes.product_detail).toHaveBeenCalledTimes(1);
      expect(routes.product_detail).toHaveBeenCalledWith('product-1');
    });
  });
});
