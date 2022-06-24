import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/products/actions';
import { addUrlParams } from '@/js/utils/api';

import { storeWithApi } from './../../utils';

describe('fetchProducts', () => {
  describe('success', () => {
    test('GETs products from api', () => {
      const store = storeWithApi({});
      const product = {
        id: 'p1',
        title: 'Product 1',
        category: 'Salesforce',
        description: 'This is a test product.',
      };
      fetchMock.getOnce(window.api_urls.productcategory_list(), [
        {
          id: 1,
          title: 'Salesforce',
          first_page: { next: null, results: [product] },
        },
      ]);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const succeeded = {
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: {
          products: [product],
          categories: [{ id: 1, title: 'Salesforce', next: null }],
        },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProducts()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('throws Error', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.productcategory_list(), 'string');

      expect.assertions(1);
      return expect(store.dispatch(actions.fetchProducts())).rejects.toThrow();
    });

    test('dispatches FETCH_PRODUCTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.productcategory_list(), 500);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const failed = {
        type: 'FETCH_PRODUCTS_FAILED',
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchProducts()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchMoreProducts', () => {
  let url;

  beforeAll(() => {
    const baseUrl = window.api_urls.product_list();
    const filters = { category: 30, page: 2 };
    url = addUrlParams(baseUrl, filters);
  });

  describe('success', () => {
    test('GETs next products list for category', () => {
      const store = storeWithApi({});
      const id = 30;
      const nextProducts = [{ id: 'p2', title: 'product-2' }];
      const mockResponse = {
        count: 2,
        next: null,
        results: nextProducts,
      };
      fetchMock.getOnce(url, mockResponse);
      const started = {
        type: 'FETCH_MORE_PRODUCTS_STARTED',
        payload: { url, id },
      };
      const succeeded = {
        type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
        payload: { products: nextProducts, category: id, next: null },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchMoreProducts({ url, id })).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('throws Error', () => {
      const store = storeWithApi({});
      const id = 30;
      fetchMock.getOnce(url, 'string');

      expect.assertions(1);
      return expect(
        store.dispatch(actions.fetchMoreProducts({ id, url })),
      ).rejects.toThrow();
    });

    test('dispatches FETCH_MORE_PRODUCTS_FAILED action', () => {
      const store = storeWithApi({});
      const id = 30;
      fetchMock.getOnce(url, 500);
      const started = {
        type: 'FETCH_MORE_PRODUCTS_STARTED',
        payload: { url, id },
      };
      const failed = {
        type: 'FETCH_MORE_PRODUCTS_FAILED',
        payload: { url, id },
      };

      expect.assertions(5);
      return store
        .dispatch(actions.fetchMoreProducts({ url, id }))
        .catch(() => {
          const allActions = store.getActions();
          expect(allActions[0]).toEqual(started);
          expect(allActions[1].type).toBe('ERROR_ADDED');
          expect(allActions[1].payload.message).toBe('Internal Server Error');
          expect(allActions[2]).toEqual(failed);
          expect(window.console.error).toHaveBeenCalled();
        });
    });
  });
});

describe('fetchProduct', () => {
  let baseUrl;

  beforeAll(() => {
    baseUrl = window.api_urls.product_get_one();
  });

  describe('success', () => {
    test('GETs product from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      const product = { id: 'p1', slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), product);
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProduct(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    test('stores null if no product returned from api', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 404);
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product: null },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProduct(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PRODUCT_FAILED action', () => {
      const store = storeWithApi({});
      const filters = { slug: 'product-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 500);
      const started = {
        type: 'FETCH_PRODUCT_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_PRODUCT_FAILED',
        payload: filters,
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchProduct(filters)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchVersion', () => {
  let baseUrl;

  beforeAll(() => {
    baseUrl = window.api_urls.version_get_one();
  });

  describe('success', () => {
    test('GETs version from api', () => {
      const store = storeWithApi({});
      const filters = { product: 'p1', label: 'v1' };
      const version = { id: 'v1', label: 'v1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), version);
      const started = {
        type: 'FETCH_VERSION_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { ...filters, version },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchVersion(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    test('stores null if no version returned from api', () => {
      const store = storeWithApi({});
      const filters = { product: 'p1', label: 'v1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 404);
      const started = {
        type: 'FETCH_VERSION_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { ...filters, version: null },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchVersion(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_VERSION_FAILED action', () => {
      const store = storeWithApi({});
      const filters = { product: 'p1', label: 'v1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 500);
      const started = {
        type: 'FETCH_VERSION_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_VERSION_FAILED',
        payload: filters,
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchVersion(filters)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchAdditionalPlans', () => {
  let baseUrl, filters;

  beforeAll(() => {
    baseUrl = window.api_urls.version_additional_plans('v1');
    filters = { product: 'p1', version: 'v1' };
  });

  describe('success', () => {
    test('GETs additional_plans from api', () => {
      const store = storeWithApi({});
      const plan = {
        id: 'plan-1',
        title: 'Plan 1',
        description: 'This is a test plan.',
      };
      fetchMock.getOnce(baseUrl, [plan]);
      const started = {
        type: 'FETCH_ADDITIONAL_PLANS_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
        payload: { ...filters, plans: [plan] },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchAdditionalPlans(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('throws Error', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(baseUrl, 'string');

      expect.assertions(1);
      return expect(
        store.dispatch(actions.fetchAdditionalPlans(filters)),
      ).rejects.toThrow();
    });

    test('dispatches FETCH_ADDITIONAL_PLANS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(baseUrl, {
        status: 500,
        body: { non_field_errors: ['Foobar'] },
      });
      const started = {
        type: 'FETCH_ADDITIONAL_PLANS_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_ADDITIONAL_PLANS_FAILED',
        payload: filters,
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchAdditionalPlans(filters)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual(['Foobar']);
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchPlan', () => {
  let baseUrl, filters;

  beforeAll(() => {
    baseUrl = window.api_urls.plan_get_one();
    filters = { product: 'p1', version: 'v1', slug: 'plan-1' };
  });

  describe('success', () => {
    test('GETs plan from api', () => {
      const store = storeWithApi({});
      const plan = { id: 'plan-id', slug: 'plan-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), plan);
      const started = {
        type: 'FETCH_PLAN_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plan },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPlan(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });

    test('stores null if no plan returned from api', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 404);
      const started = {
        type: 'FETCH_PLAN_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plan: null },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPlan(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PLAN_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 500);
      const started = {
        type: 'FETCH_PLAN_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_PLAN_FAILED',
        payload: filters,
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchPlan(filters)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
