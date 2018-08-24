import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../utils';

import ProductsList from 'components/products';

describe('<Products />', () => {
  test('renders products list', () => {
    const initialState = {};
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
    );

    expect(getByText('Product 1')).toBeVisible();
  });
});
