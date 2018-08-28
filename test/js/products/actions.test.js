import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'products/actions';

describe('fetchProducts', () => {
  afterEach(fetchMock.restore);

  describe('success', () => {
    const store = storeWithApi({});

    test('GETs products from api', () => {
      const product = {
        id: 1,
        title: 'Product 1',
        version: '3.130',
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

      return store.dispatch(actions.fetchProducts()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    const store = storeWithApi({});

    test('dispatches FETCH_PRODUCTS_FAILED action', () => {
      fetchMock.getOnce(window.api_urls.product_list(), 500);
      const started = {
        type: 'FETCH_PRODUCTS_STARTED',
      };
      const failed = {
        type: 'FETCH_PRODUCTS_FAILED',
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchProducts()).then(() => {
        expect(store.getActions()).toEqual([started, failed]);
      });
    });
  });
});
