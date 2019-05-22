import fetchMock from 'fetch-mock';

import { storeWithApi } from './../../utils';

import * as actions from 'store/products/actions';
import { addUrlParams } from 'utils/api';

describe('fetchProducts', () => {
  describe('success', () => {
    test('GETs products from api', () => {
      const store = storeWithApi({});
      const product = {
        id: 'p1',
        title: 'Product 1',
        description: 'This is a test product.',
      };
      fetchMock.getOnce(window.api_urls.product_list(), [product]);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const succeeded = {
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: [product],
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
      fetchMock.getOnce(window.api_urls.product_list(), 'string');

      expect.assertions(1);
      return expect(store.dispatch(actions.fetchProducts())).rejects.toThrow();
    });

    test('dispatches FETCH_PRODUCTS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.product_list(), 500);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const failed = {
        type: 'FETCH_PRODUCTS_FAILED',
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchProducts()).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchVersion', () => {
  let baseUrl;

  beforeAll(() => {
    baseUrl = window.api_urls.version_list();
  });

  describe('success', () => {
    test('GETs version from api', () => {
      const store = storeWithApi({});
      const filters = { product: 'p1', label: 'v1' };
      const version = { id: 'v1', label: 'v1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), [version]);
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
      fetchMock.getOnce(addUrlParams(baseUrl, filters), []);
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
    test('throws Error', () => {
      const store = storeWithApi({});
      const filters = { product: 'p1', label: 'v1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 'string');

      expect.assertions(1);
      return expect(
        store.dispatch(actions.fetchVersion(filters)),
      ).rejects.toThrow();
    });

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

      expect.assertions(2);
      return store.dispatch(actions.fetchVersion(filters)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchPlans', () => {
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
        type: 'FETCH_PLANS_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { ...filters, plans: [plan] },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPlans(filters)).then(() => {
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
        store.dispatch(actions.fetchPlans(filters)),
      ).rejects.toThrow();
    });

    test('dispatches FETCH_PLANS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(baseUrl, 500);
      const started = {
        type: 'FETCH_PLANS_STARTED',
        payload: filters,
      };
      const failed = {
        type: 'FETCH_PLANS_FAILED',
        payload: filters,
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchPlans(filters)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('fetchPlan', () => {
  let baseUrl, filters;

  beforeAll(() => {
    baseUrl = window.api_urls.plan_list();
    filters = { product: 'p1', version: 'v1', slug: 'plan-1' };
  });

  describe('success', () => {
    test('GETs plan from api', () => {
      const store = storeWithApi({});
      const plan = { id: 'plan-id', slug: 'plan-1' };
      fetchMock.getOnce(addUrlParams(baseUrl, filters), [plan]);
      const started = {
        type: 'FETCH_PLAN_STARTED',
        payload: filters,
      };
      const succeeded = {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plans: [plan] },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPlan(filters)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('throws Error', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(addUrlParams(baseUrl, filters), 'string');

      expect.assertions(1);
      return expect(
        store.dispatch(actions.fetchPlan(filters)),
      ).rejects.toThrow();
    });

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

      expect.assertions(2);
      return store.dispatch(actions.fetchPlan(filters)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
