import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';

import { renderWithRedux } from './../../utils';

import ProductsList from 'components/products/list';

describe('<Products />', () => {
  const setup = (
    initialState = {
      products: [],
    },
    props = {},
  ) => {
    const { getByText, getAllByText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <ProductsList {...props} />
      </MemoryRouter>,
      initialState,
    );
    return { getByText, getAllByText, queryByText };
  };

  describe('site welcome_text', () => {
    beforeAll(() => {
      window.GLOBALS.SITE = {
        welcome_text: 'Hi there!',
      };
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders welcome text', () => {
      const { getByText } = setup();

      expect(getByText('Hi there!')).toBeVisible();
    });
  });

  test('renders products list (empty)', () => {
    const { getByText } = setup();

    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });

  test('renders products list (1 category)', () => {
    const initialState = {
      products: [
        {
          id: 'p1',
          title: 'Product 1',
          description: 'This is a test product.',
          category: 'salesforce',
          most_recent_version: {
            id: 'v1',
            product: 'p1',
            label: '1.0.0',
            description: 'This is a test product version.',
            primary_plan: {
              id: 'plan-1',
              title: 'My Plan',
              is_listed: true,
              is_allowed: true,
              requires_preflight: true,
            },
            is_listed: true,
          },
          is_listed: true,
          is_allowed: true,
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
          id: 'p1',
          title: 'Product 1',
          description: 'This is a test product.',
          category: 'salesforce',
          icon: {
            type: 'slds',
            category: 'utility',
            name: 'salesforce1',
          },
          most_recent_version: {
            id: 'v1',
            product: 'p1',
            label: '1.0.0',
            description: 'This is a test product version.',
            primary_plan: {
              id: 'plan-1',
              title: 'My Plan',
              is_listed: true,
              is_allowed: true,
              requires_preflight: true,
            },
            is_listed: true,
          },
          is_listed: true,
          is_allowed: true,
        },
        {
          id: 'p2',
          title: 'Product 2',
          description: 'This is another test product.',
          category: 'community',
          color: '#fff',
          most_recent_version: {
            id: 'v2',
            product: 'p2',
            label: '1.0.0',
            description: 'This is a test product version.',
            primary_plan: {
              id: 'plan-2',
              title: 'My Plan',
              is_listed: true,
              is_allowed: true,
              requires_preflight: true,
            },
            is_listed: true,
          },
          is_listed: true,
          is_allowed: true,
        },
        {
          id: 'p3',
          title: 'Product 3',
          description: 'This is an unlisted product.',
          category: 'community',
          most_recent_version: {
            id: 'v3',
            product: 'p3',
            label: '1.0.0',
            description: 'This is a product version.',
            primary_plan: {
              id: 'plan-3',
              title: 'My Plan',
              is_listed: true,
              is_allowed: true,
              requires_preflight: true,
            },
            is_listed: true,
          },
          is_listed: false,
        },
      ],
    };

    afterEach(() => {
      window.sessionStorage.removeItem('activeProductsTab');
    });

    test('renders products list', () => {
      const { getByText, getAllByText, queryByText } = setup(initialState);
      const activeTab = getByText('salesforce');

      expect(getAllByText('Product 1')[0]).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(queryByText('Product 3')).toBeNull();
      expect(activeTab).toBeVisible();
      expect(getByText('community')).toBeVisible();
      expect(activeTab).toHaveClass('slds-active');
    });

    test('uses saved active tab', () => {
      window.sessionStorage.setItem('activeProductsTab', 'community');
      const { getByText, getAllByText } = setup(initialState);
      const activeTab = getByText('community');

      expect(getAllByText('Product 1')[0]).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('salesforce')).toBeVisible();
      expect(activeTab).toBeVisible();
      expect(activeTab).toHaveClass('slds-active');
    });

    test('uses saved tab from url hash', () => {
      window.sessionStorage.setItem('activeProductsTab', 'salesforce');
      window.location.hash = 'community';
      const { getByText, getAllByText } = setup(initialState);
      const activeTab = getByText('community');

      expect(getAllByText('Product 1')[0]).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('salesforce')).toBeVisible();
      expect(activeTab).toBeVisible();
      expect(activeTab).toHaveClass('slds-active');

      window.location.hash = '';
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
