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
type FetchAdditionalPlansStarted = {
  type: 'FETCH_ADDITIONAL_PLANS_STARTED',
  payload: { product: string, version: string },
};
type FetchAdditionalPlansFailed = {
  type: 'FETCH_ADDITIONAL_PLANS_FAILED',
  payload: { product: string, version: string },
};
type FetchAdditionalPlansSucceeded = {
  type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
  payload: { product: string, version: string, plans: Array<Plan> },
};
type PlanFilters = {|
  product: string,
  version: string,
  slug: string,
|};
type FetchPlanStarted = {
  type: 'FETCH_PLAN_STARTED',
  payload: PlanFilters,
};
type FetchPlanSucceeded = {
  type: 'FETCH_PLAN_SUCCEEDED',
  payload: { ...PlanFilters, plans: Array<Plan> },
};
type FetchPlanFailed = {
  type: 'FETCH_PLAN_FAILED',
  payload: PlanFilters,
};

export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchVersionStarted
  | FetchVersionSucceeded
  | FetchVersionFailed
  | FetchAdditionalPlansStarted
  | FetchAdditionalPlansFailed
  | FetchAdditionalPlansSucceeded
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
      const products = response.results;
      if (!Array.isArray(products)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({ type: 'FETCH_PRODUCTS_SUCCEEDED', payload: products });
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

export const fetchAdditionalPlans = (filters: {
  product: string,
  version: string,
}): ThunkAction => (dispatch, getState, { apiFetch }) => {
  dispatch({ type: 'FETCH_ADDITIONAL_PLANS_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_additional_plans(filters.version);
  return apiFetch(baseUrl)
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
        payload: { ...filters, plans: response },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_ADDITIONAL_PLANS_FAILED', payload: filters });
      throw err;
    });
};

export const fetchPlan = (filters: PlanFilters): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'FETCH_PLAN_STARTED', payload: filters });
  const baseUrl = window.api_urls.plan_list();
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
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plans: response },
      });
    })
    .catch(err => {
      dispatch({ type: 'FETCH_PLAN_FAILED', payload: filters });
      throw err;
    });
};
