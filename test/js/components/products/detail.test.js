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
        image_url: 'http://foo.bar',
        most_recent_version: {
          id: 1,
          product: 1,
          label: '1.0.0',
          description: 'This is a test product version.',
          primary_plan: {
            id: 1,
            title: 'My Plan',
          },
          secondary_plan: {
            id: 2,
            title: 'My Secondary Plan',
          },
          additional_plans: [
            {
              id: 3,
              title: 'My Additional Plan',
            },
          ],
        },
      },
    ],
  };
  const setup = (initialState = defaultState, id = 1) => {
    const { getByText, queryByText, getByAltText } = renderWithRedux(
      <MemoryRouter>
        <ProductDetail match={{ params: { id } }} />
      </MemoryRouter>,
      initialState,
    );
    return { getByText, queryByText, getByAltText };
  };

  test('renders product detail', () => {
    const { getByText, getByAltText } = setup();

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('This is a test product version.')).toBeVisible();
    expect(getByText('My Plan')).toBeVisible();
    expect(getByText('My Secondary Plan')).toBeVisible();
    expect(getByText('My Additional Plan')).toBeVisible();
    expect(getByAltText('Product 1')).toHaveAttribute('src', 'http://foo.bar');
  });

  test('handles missing secondary/additional plans', () => {
    const product = {
      id: 1,
      title: 'Product 1',
      version: '3.130',
      description: 'This is a test product.',
      category: 'salesforce',
      most_recent_version: {
        id: 1,
        product: 1,
        label: '1.0.0',
        description: 'This is a test product version.',
        primary_plan: {
          id: 1,
          title: 'My Plan',
        },
        additional_plans: [],
      },
    };
    const { getByText, queryByText } = setup({ products: [product] });

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('This is a test product version.')).toBeVisible();
    expect(getByText('My Plan')).toBeVisible();
    expect(queryByText('My Secondary Plan')).toBeNull();
  });

  test('redirects to products list if no product found with id', () => {
    const { queryByText } = setup({ products: [] });

    expect(queryByText('Product 1')).toBeNull();
  });
});
