import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import ProductItem from 'components/products/listItem';

describe('<ProductItem />', () => {
  const setup = initialState => {
    const { getByText } = render(
      <MemoryRouter>
        <>
          {initialState.products.map(item => (
            <ProductItem item={item} key={item.id} />
          ))}
        </>
      </MemoryRouter>,
    );
    return { getByText };
  };

  test('renders product', () => {
    const initialState = {
      products: [
        {
          id: 'p1',
          title: 'Product 1',
          description: 'This is a test product.',
          category: 'salesforce',
          icon: {
            type: 'url',
            url: 'http://foo.bar',
          },
          most_recent_version: {
            id: 'v1',
            product: 'p1',
            label: '1.0.0',
            description: 'This is a test product version.',
            primary_plan: {
              id: 'plan-1',
              title: 'My Plan',
            },
            additional_plans: [],
          },
        },
      ],
    };
    const { getByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
  });
});
