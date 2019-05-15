// @flow

import type { ThunkAction } from 'redux-thunk';

import { addUrlParams } from 'utils/api';
import type { Products, Version } from 'store/products/reducer';
import type { Plan } from 'store/plans/reducer';

type VersionFilters = {| product: string, label: string |};
type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: Products,
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
type FetchVersionStarted = {
  type: 'FETCH_VERSION_STARTED',
  payload: VersionFilters,
};
type FetchVersionSucceeded = {
  type: 'FETCH_VERSION_SUCCEEDED',
  payload: { ...VersionFilters, version: Version | null },
};
type FetchVersionFailed = {
  type: 'FETCH_VERSION_FAILED',
  payload: VersionFilters,
};
type FetchPlansStarted = {
  type: 'FETCH_PLANS_STARTED',
  payload: { product: string, version: string },
};
type FetchPlansFailed = {
  type: 'FETCH_PLANS_FAILED',
  payload: { product: string, version: string },
};
type FetchPlansSucceeded = {
  type: 'FETCH_PLANS_SUCCEEDED',
  payload: { product: string, version: string, response: Array<Plan> },
};
export type FetchPlanStarted = {
  type: 'FETCH_PLAN_STARTED',
  payload: Plan,
};
export type FetchPlanSucceeded = {
  type: 'FETCH_PLAN_SUCCEEDED',
  payload: Plan,
};
export type FetchPlanFailed = {
  type: 'FETCH_PLAN_FAILED',
  payload: Plan,
};

export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchVersionStarted
  | FetchVersionSucceeded
  | FetchVersionFailed
  | FetchPlansStarted
  | FetchPlansFailed
  | FetchPlansSucceeded
  | FetchPlanStarted
  | FetchPlanSucceeded
  | FetchPlanFailed;

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

export const fetchVersion = (filters: VersionFilters): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_VERSION_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_list();
  return apiFetch(addUrlParams(baseUrl, { ...filters }))
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { ...filters, version: response[0] || null },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_VERSION_FAILED', payload: filters });
      throw err;
    });
};

export const fetchPlans = (product: string, version: string): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PLANS_STARTED', payload: { product, version } });
  const baseUrl = window.api_urls.version_list();
  return apiFetch(`${baseUrl}${version}/additional_plans`)
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { response, product, version },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_PLANS_FAILED', payload: { product, version } });
      throw err;
    });
};
