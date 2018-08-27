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

  test('renders products list', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
          version: '3.130',
          description: 'This is a test product.',
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
  });

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
});
