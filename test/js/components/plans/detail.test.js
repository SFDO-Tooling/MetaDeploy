import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../../utils';

import PlanDetail from 'components/plans/detail';

const defaultState = {
  products: [
    {
      id: 1,
      slug: 'product-1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
      image: null,
      most_recent_version: {
        id: 1,
        product: 1,
        label: '1.0.0',
        description: 'This is a test product version.',
        primary_plan: {
          id: 1,
          slug: 'my-plan',
          title: 'My Plan',
          preflight_message: 'Preflight text...',
        },
        secondary_plan: {
          id: 2,
          slug: 'other-plan',
          title: 'My Other Plan',
          preflight_message: 'Other preflight text...',
        },
        additional_plans: [
          {
            id: 3,
            slug: 'third-plan',
            title: 'My Third Plan',
            preflight_message: 'Third preflight text...',
          },
        ],
      },
    },
  ],
};

describe('<PlanDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
      versionLabel: '1.0.0',
      planSlug: 'my-plan',
    };
    const opts = Object.assign({}, defaults, options);
    const { productSlug, versionLabel, planSlug } = opts;
    const { getByText, queryByText, getByAltText } = renderWithRedux(
      <MemoryRouter>
        <PlanDetail
          match={{ params: { productSlug, versionLabel, planSlug } }}
        />
      </MemoryRouter>,
      opts.initialState,
      opts.customStore,
    );
    return { getByText, queryByText, getByAltText };
  };

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ initialState: { products: [] } });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  test('renders primary_plan detail', () => {
    const { getByText } = setup();

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('1.0.0')).toBeVisible();
    expect(getByText('My Plan')).toBeVisible();
    expect(getByText('Preflight text...')).toBeVisible();
  });

  test('renders secondary_plan detail', () => {
    const { getByText } = setup({
      planSlug: 'other-plan',
    });

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('1.0.0')).toBeVisible();
    expect(getByText('My Other Plan')).toBeVisible();
    expect(getByText('Other preflight text...')).toBeVisible();
  });

  test('renders additional_plan detail', () => {
    const { getByText } = setup({
      planSlug: 'third-plan',
    });

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('1.0.0')).toBeVisible();
    expect(getByText('My Third Plan')).toBeVisible();
    expect(getByText('Third preflight text...')).toBeVisible();
  });

  describe('no plan', () => {
    test('renders <PlanNotFound />', () => {
      const { getByText } = setup({
        planSlug: 'nope',
      });

      expect(getByText('another plan')).toBeVisible();
    });
  });
});
