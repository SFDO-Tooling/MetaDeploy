import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import ProductItem from 'components/products/listItem';

describe('<ProductItem />', () => {
  const setup = initialState => {
    const { getByText } = render(
      <MemoryRouter>
        <div>
          {initialState.products.map(item => (
            <ProductItem item={item} key={item.id} />
          ))}
        </div>
      </MemoryRouter>,
    );
    return { getByText };
  };

  test('renders product', () => {
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
    const { getByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
  });
});
