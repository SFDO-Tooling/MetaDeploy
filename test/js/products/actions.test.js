import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'products/actions';
import { addUrlParams } from 'utils/api';

describe('fetchProducts', () => {
  afterEach(fetchMock.restore);

  describe('success', () => {
    test('GETs products from api', () => {
      const store = storeWithApi({});
      const product = {
        id: 1,
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

describe('fetchVersions', () => {
  let url;

  beforeAll(() => {
    url = addUrlParams(window.api_urls.version_list(), { product: 1 });
  });

  afterEach(fetchMock.restore);

  describe('success', () => {
    test('GETs versions from api', () => {
      const store = storeWithApi({});
      const version = { id: 2 };
      fetchMock.getOnce(url, [version]);
      const started = {
        type: 'FETCH_VERSIONS_STARTED',
        payload: 1,
      };
      const succeeded = {
        type: 'FETCH_VERSIONS_SUCCEEDED',
        payload: { id: 1, versions: [version] },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchVersions(1)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('throws Error', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, 'string');

      expect.assertions(1);
      return expect(store.dispatch(actions.fetchVersions(1))).rejects.toThrow();
    });

    test('dispatches FETCH_VERSIONS_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, 500);
      const started = {
        type: 'FETCH_VERSIONS_STARTED',
        payload: 1,
      };
      const failed = {
        type: 'FETCH_VERSIONS_FAILED',
        payload: 1,
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchVersions(1)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
