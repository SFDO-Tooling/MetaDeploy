// @flow

import type { ThunkAction } from 'redux-thunk';

import apiFetch, { addUrlParams } from 'utils/api';
import type { Product, Version } from 'store/products/reducer';
import type { Plan } from 'store/plans/reducer';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: Array<Product>,
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
type ProductFilters = {|
  slug: string,
|};
type FetchProductStarted = {
  type: 'FETCH_PRODUCT_STARTED',
  payload: ProductFilters,
};
type FetchProductSucceeded = {
  type: 'FETCH_PRODUCT_SUCCEEDED',
  payload: { ...ProductFilters, product: Product | null },
};
type FetchProductFailed = {
  type: 'FETCH_PRODUCT_FAILED',
  payload: ProductFilters,
};
type VersionFilters = {| product: string, label: string |};
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
  payload: { ...PlanFilters, plan: Plan | null },
};
type FetchPlanFailed = {
  type: 'FETCH_PLAN_FAILED',
  payload: PlanFilters,
};

export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchProductStarted
  | FetchProductSucceeded
  | FetchProductFailed
  | FetchVersionStarted
  | FetchVersionSucceeded
  | FetchVersionFailed
  | FetchAdditionalPlansStarted
  | FetchAdditionalPlansFailed
  | FetchAdditionalPlansSucceeded
  | FetchPlanStarted
  | FetchPlanSucceeded
  | FetchPlanFailed;

export const fetchProducts = (): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  return apiFetch(window.api_urls.product_list(), dispatch)
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

export const fetchProduct = (
  filters: ProductFilters,
): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_PRODUCT_STARTED', payload: filters });
  const baseUrl = window.api_urls.product_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then(response =>
      dispatch({
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product: response || null },
      }),
    )
    .catch(err => {
      dispatch({ type: 'FETCH_PRODUCT_FAILED', payload: filters });
      throw err;
    });
};

export const fetchVersion = (
  filters: VersionFilters,
): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_VERSION_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then(response =>
      dispatch({
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { ...filters, version: response || null },
      }),
    )
    .catch(err => {
      dispatch({ type: 'FETCH_VERSION_FAILED', payload: filters });
      throw err;
    });
};

export const fetchAdditionalPlans = (filters: {
  product: string,
  version: string,
}): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_ADDITIONAL_PLANS_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_additional_plans(filters.version);
  return apiFetch(baseUrl, dispatch)
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

export const fetchPlan = (filters: PlanFilters): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_PLAN_STARTED', payload: filters });
  const baseUrl = window.api_urls.plan_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then(response =>
      dispatch({
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plan: response || null },
      }),
    )
    .catch(err => {
      dispatch({ type: 'FETCH_PLAN_FAILED', payload: filters });
      throw err;
    });
};
