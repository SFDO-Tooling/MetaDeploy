import React from 'react';
import fetchMock from 'fetch-mock';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux, storeWithApi } from './../utils';

import ProductsList from 'components/products';

describe('<Products />', () => {
  beforeEach(() => {
    fetchMock.getOnce(window.URLS.product_list(), []);
  });

  afterEach(fetchMock.restore);

  test('fetches products', () => {
    const initialState = {
      products: [],
    };
    renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
      storeWithApi,
    );

    expect(fetchMock.called('/api/products/')).toBe(true);
  });

  test('renders products list (empty)', () => {
    const initialState = {
      products: [],
    };
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
      storeWithApi,
    );

    expect(getByText('Uh oh.')).toBeVisible();
  });

  test('renders products list (1 category)', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
          version: '3.130',
          description: 'This is a test product.',
          category: 'salesforce',
        },
      ],
    };
    const { getByText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
      storeWithApi,
    );

    expect(getByText('Product 1')).toBeVisible();
    expect(queryByText('salesforce')).toBeNull();
  });

  test('renders products list (2 categories)', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
          version: '3.130',
          description: 'This is a test product.',
          category: 'salesforce',
        },
        {
          id: 2,
          title: 'Product 2',
          version: '3.131',
          description: 'This is another test product.',
          category: 'community',
        },
      ],
    };
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
      storeWithApi,
    );

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('Product 2')).toBeInTheDocument();
    expect(getByText('salesforce')).toBeVisible();
    expect(getByText('community')).toBeVisible();
  });
});
