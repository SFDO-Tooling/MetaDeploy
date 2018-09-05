import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../../utils';

import ProductItem from 'components/products/listItem';

describe('<ProductItem />', () => {
  const setup = initialState => {
    const { getByAltText } = renderWithRedux(
      <MemoryRouter>
        <div>
          {initialState.products.map(item => (
            <ProductItem item={item} key={item.id} />
          ))}
        </div>
      </MemoryRouter>,
      initialState,
    );
    return { getByAltText };
  };

  test('renders product with custom icon', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
          version: '3.130',
          description: 'This is a test product.',
          category: 'salesforce',
          icon: {
            type: 'url',
            url: 'http://foo.bar',
          },
        },
      ],
    };
    const { getByAltText } = setup(initialState);
    const icon = getByAltText('Product 1');

    expect(icon).toBeVisible();
    expect(icon).toHaveAttribute('src', 'http://foo.bar');
  });
});
