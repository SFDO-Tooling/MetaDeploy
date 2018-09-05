import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../../utils';

import ProductDetail from 'components/products/detail';

describe('<ProductDetail />', () => {
  const defaultState = {
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
  const setup = (initialState = defaultState, id = 1) => {
    const { getByText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <ProductDetail match={{ params: { id } }} />
      </MemoryRouter>,
      initialState,
    );
    return { getByText, queryByText };
  };

  test('renders product detail', () => {
    const { getByText } = setup();

    expect(getByText('Product 1')).toBeVisible();
  });

  test('redirects to products list if no product found with id', () => {
    const { queryByText } = setup({ products: [] });

    expect(queryByText('Product 1')).toBeNull();
  });
});
