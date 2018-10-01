import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../../utils';

import ProductsList from 'components/products/list';

describe('<Products />', () => {
  const setup = (initialState, props = {}) => {
    const { getByText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList {...props} />
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

    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });

  test('renders products list (1 category)', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
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
        },
      ],
    };
    const { getByText, queryByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
    expect(queryByText('salesforce')).toBeNull();
  });

  describe('2 categories', () => {
    const initialState = {
      products: [
        {
          id: 1,
          title: 'Product 1',
          description: 'This is a test product.',
          category: 'salesforce',
          icon: {
            type: 'slds',
            category: 'utility',
            name: 'salesforce1',
          },
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
        },
        {
          id: 2,
          title: 'Product 2',
          description: 'This is another test product.',
          category: 'community',
          color: '#fff',
          most_recent_version: {
            id: 2,
            product: 2,
            label: '1.0.0',
            description: 'This is a test product version.',
            primary_plan: {
              id: 2,
              title: 'My Plan',
            },
            additional_plans: [],
          },
        },
      ],
    };

    afterEach(() => {
      window.sessionStorage.removeItem('activeProductsTab');
    });

    test('renders products list', () => {
      const { getByText } = setup(initialState);
      const activeTab = getByText('salesforce');

      expect(getByText('Product 1')).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(activeTab).toBeVisible();
      expect(getByText('community')).toBeVisible();
      expect(activeTab).toHaveClass('slds-active');
    });

    test('uses saved active tab', () => {
      const { getByText } = setup(initialState, {
        activeProductsTab: 'community',
      });
      const activeTab = getByText('community');

      expect(getByText('Product 1')).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('salesforce')).toBeVisible();
      expect(activeTab).toBeVisible();
      expect(activeTab).toHaveClass('slds-active');
    });

    describe('tab onSelect', () => {
      test('saves new activeProductsTab', () => {
        const { getByText } = setup(initialState);
        const communityTab = getByText('community');
        fireEvent.click(communityTab);
        const actual = window.sessionStorage.getItem('activeProductsTab');

        expect(actual).toEqual('community');
      });
    });
  });
});
