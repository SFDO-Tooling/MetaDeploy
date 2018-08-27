// @flow

import type { ThunkAction } from 'redux-thunk';

import type { Products } from 'products/reducer';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: Products,
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed;

export const fetchProducts = (): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  return apiFetch(window.URLS.product_list())
    .then(response =>
      dispatch({ type: 'FETCH_PRODUCTS_SUCCEEDED', payload: response }),
    )
    .catch(() => dispatch({ type: 'FETCH_PRODUCTS_FAILED' }));
};
