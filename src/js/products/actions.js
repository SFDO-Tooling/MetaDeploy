// @flow

import { addUrlParams } from 'utils/api';

import type { ThunkAction } from 'redux-thunk';

import type { Products, Versions } from 'products/reducer';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: Products,
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
type FetchVersionsStarted = { type: 'FETCH_VERSIONS_STARTED', payload: number };
type FetchVersionsSucceeded = {
  type: 'FETCH_VERSIONS_SUCCEEDED',
  payload: { id: number, versions: Versions },
};
type FetchVersionsFailed = { type: 'FETCH_VERSIONS_FAILED', payload: number };
export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchVersionsStarted
  | FetchVersionsSucceeded
  | FetchVersionsFailed;

export const fetchProducts = (): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  return apiFetch(window.api_urls.product_list())
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({ type: 'FETCH_PRODUCTS_SUCCEEDED', payload: response });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_PRODUCTS_FAILED' });
      throw err;
    });
};

export const fetchVersions = (productId: number): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_VERSIONS_STARTED', payload: productId });
  const baseUrl = window.api_urls.version_list();
  return apiFetch(addUrlParams(baseUrl, { product: productId }))
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_VERSIONS_SUCCEEDED',
        payload: { id: productId, versions: response },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_VERSIONS_FAILED', payload: productId });
      throw err;
    });
};
