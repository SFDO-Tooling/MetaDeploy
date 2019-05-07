// @flow

import type { ThunkAction } from 'redux-thunk';

import { addUrlParams } from 'utils/api';
import type { Products, Version } from 'store/products/reducer';

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
  payload: [], // think this needs to be a type like Version.additional_plans ?
};
type FetchPlansFailed = {
  type: 'FETCH_PLANS_FAILED',
  payload: [],
};
type FetchPlansSucceeded = {
  type: 'FETCH_PLANS_SUCCEEDED',
  payload: [],
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
  | FetchPlansSucceeded;

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

export const fetchPlans = (version: string): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PLANS_STARTED', payload: version });
  const baseUrl = window.api_urls.versionList();
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
        payload: response,
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_PLANS_FAILED', payload: [] });
      throw err;
    });

  // - Store them each as { [slug]: Plan } on `additional_plans`.
  // - Also need to iterate through each `plan.old_slugs` and save plan under
  //   each of those slugs as well?
  // - Set `fetched_additional_plans: true`
};
