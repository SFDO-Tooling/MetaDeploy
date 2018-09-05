import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../../utils';

import ProductsList from 'components/products/list';

describe('<Products />', () => {
  const setup = initialState => {
    const { getByText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList />
      </MemoryRouter>,
      initialState,
    );
    return { getByText, queryByText };
  };

  test('renders products list (empty)', () => {
    const initialState = {
      products: [],
    };
    const { getByText } = setup(initialState);

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
    const { getByText, queryByText } = setup(initialState);

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
          icon: {
            type: 'slds',
            category: 'utility',
            name: 'salesforce1',
          },
        },
        {
          id: 2,
          title: 'Product 2',
          version: '3.131',
          description: 'This is another test product.',
          category: 'community',
          color: '#fff',
        },
      ],
    };
    const { getByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('Product 2')).toBeInTheDocument();
    expect(getByText('salesforce')).toBeVisible();
    expect(getByText('community')).toBeVisible();
  });
});
