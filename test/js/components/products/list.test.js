import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProductsList from '@/js/components/products/list';
import { fetchMoreProducts } from '@/js/store/products/actions';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithApi,
} from './../../utils';

jest.mock('react-fns', () => ({
  withScroll(Component) {
    // eslint-disable-next-line react/display-name
    return (props) => <Component x={0} y={0} {...props} />;
  },
}));
jest.mock('@/js/store/products/actions');
fetchMoreProducts.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  fetchMoreProducts.mockClear();
});

describe('<Products />', () => {
  const setup = (
    initialState = {
      products: { products: [], notFound: [], categories: [] },
    },
    props = {},
    rerenderFn = null,
  ) => {
    const ui = (
      <MemoryRouter>
        <ProductsList {...props} />
      </MemoryRouter>
    );
    if (rerenderFn) {
      return reRenderWithRedux(ui, storeWithApi(initialState), rerenderFn);
    }
    return renderWithRedux(ui, initialState, storeWithApi);
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
      products: {
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
                supported_orgs: 'Persistent',
              },
              is_listed: true,
            },
            is_listed: true,
            is_allowed: true,
          },
        ],
        notFound: [],
        categories: [
          {
            id: 1,
            title: 'salesforce',
            description: '<p>This is a category</p>',
            is_listed: true,
            next: null,
          },
        ],
      },
    };
    const { getByText, queryByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
    expect(queryByText('salesforce')).toBeNull();
  });

  describe('2 categories', () => {
    const initialState = {
      products: {
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
                supported_orgs: 'Persistent',
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
                supported_orgs: 'Persistent',
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
                supported_orgs: 'Persistent',
              },
              is_listed: true,
            },
            is_listed: false,
          },
        ],
        notFound: [],
        categories: [
          {
            id: 1,
            title: 'salesforce',
            description: '',
            next: null,
            is_listed: true,
          },
          {
            id: 2,
            title: 'community',
            description: '<p>This is a category</p>',
            is_listed: true,
            next: null,
          },
        ],
      },
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
      expect(activeTab).toHaveClass('slds-is-active');
    });

    test('uses saved active tab', () => {
      window.sessionStorage.setItem('activeProductsTab', 'community');
      const { getByText, getAllByText } = setup(initialState);
      const activeTab = getByText('community');

      expect(getAllByText('Product 1')[0]).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('salesforce')).toBeVisible();
      expect(activeTab).toBeVisible();
      expect(activeTab).toHaveClass('slds-is-active');
    });

    test('uses saved tab from url hash', () => {
      window.sessionStorage.setItem('activeProductsTab', 'salesforce');
      window.location.hash = '#community';
      const { getByText, getAllByText } = setup(initialState);
      const activeTab = getByText('community');

      expect(getAllByText('Product 1')[0]).toBeVisible();
      expect(getByText('Product 2')).toBeInTheDocument();
      expect(getByText('salesforce')).toBeVisible();
      expect(activeTab).toBeVisible();
      expect(activeTab).toHaveClass('slds-is-active');

      window.location.hash = '';
    });

    describe('tab onSelect', () => {
      test('saves new activeProductsTab', () => {
        const { getByText } = setup(initialState);
        const communityTab = getByText('community');
        fireEvent.click(communityTab);
        const actual = window.sessionStorage.getItem('activeProductsTab');

        expect(actual).toBe('community');
      });

      test('changes active tab onSelect', () => {
        window.sessionStorage.setItem('activeProductsTab', 'salesforce');
        const { getByText } = setup(initialState);
        const activeTab = getByText('salesforce');
        const inactiveTab = getByText('community');

        expect(activeTab).toHaveClass('slds-is-active');
        fireEvent.click(inactiveTab);
        expect(inactiveTab).toHaveClass('slds-is-active');
      });
    });
  });

  describe('fetching more products', () => {
    const initialState = {
      products: {
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
                supported_orgs: 'Persistent',
              },
              is_listed: true,
            },
            is_listed: true,
            is_allowed: true,
          },
          {
            id: 'p2',
            title: 'Product 2',
            description: 'This is a test product.',
            category: 'community',
            most_recent_version: {
              id: 'v2',
              product: 'p2',
              label: '1.0.0',
              description: 'This is a test product version.',
              primary_plan: {
                id: 'plan-1',
                title: 'My Plan',
                is_listed: true,
                is_allowed: true,
                requires_preflight: true,
                supported_orgs: 'Persistent',
              },
              is_listed: true,
            },
            is_listed: true,
            is_allowed: true,
          },
        ],
        notFound: [],
        categories: [
          { id: 1, title: 'salesforce', next: 'sf-next-url', is_listed: true },
          {
            id: 2,
            title: 'community',
            next: 'community-next-url',
            is_listed: true,
          },
        ],
      },
    };

    beforeAll(() => {
      jest
        .spyOn(document.documentElement, 'scrollHeight', 'get')
        .mockImplementation(() => 1100);
    });

    afterEach(() => {
      window.sessionStorage.removeItem('activeProductsTab');
    });

    test('fetches next page of products for active tab', () => {
      window.sessionStorage.setItem('activeProductsTab', 'community');
      const { rerender, getByText } = setup(initialState);
      const activeTab = getByText('community');

      setup(initialState, { y: 1000 }, rerender);

      expect(activeTab).toHaveClass('slds-is-active');
      expect(getByText('Loading…')).toBeVisible();
      expect(fetchMoreProducts).toHaveBeenCalledWith({
        url: 'community-next-url',
        id: 2,
      });
    });

    test('fetches next page of products for first tab by default', () => {
      const { rerender, getByText } = setup(initialState);
      const activeTab = getByText('salesforce');

      setup(initialState, { y: 1000 }, rerender);

      expect(activeTab).toHaveClass('slds-is-active');
      expect(getByText('Loading…')).toBeVisible();
      expect(fetchMoreProducts).toHaveBeenCalledWith({
        url: 'sf-next-url',
        id: 1,
      });
    });

    test('does not fetch next page if no more products', () => {
      const state = {
        ...initialState,
        products: {
          ...initialState.products,
          categories: [
            { id: 1, title: 'salesforce', next: null, is_listed: true },
            {
              id: 2,
              title: 'community',
              next: 'community-next-url',
              is_listed: false,
            },
          ],
        },
      };
      const { rerender, queryByText } = setup(state);

      setup(state, { y: 1000 }, rerender);

      expect(queryByText('Loading…')).toBeNull();
      expect(fetchMoreProducts).not.toHaveBeenCalled();
    });
  });
});
