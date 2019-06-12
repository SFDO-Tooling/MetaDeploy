// @flow

import type { ThunkAction } from 'redux-thunk';

import apiFetch, { addUrlParams } from 'utils/api';
import type { Category, Product, Version } from 'store/products/reducer';
import type { Plan } from 'store/plans/reducer';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: [Array<Product>, Array<Category>],
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
// @TODO ADD TYPES FOR NEW ACTIONS

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

export const fetchMoreProducts = (
  category: string,
  page: number,
): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_MORE_PRODUCTS_STARTED' });
  const baseUrl = `${window.api_urls.product_list()}?category=${category}&page=${page}`;

  return apiFetch(baseUrl, dispatch)
    .then(response => {
      console.log(response);
      // SEND RESULTS, CONCAT TO PRODUCTS ARR
    })
    .catch(err => {
      dispatch({ type: 'FETCH_MORE_PRODUCTS_FAILED' });
      throw err;
    });
};

export const fetchProducts = (): ThunkAction => dispatch => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  const baseUrl = window.api_urls.productcategory_list();

  return apiFetch(baseUrl, dispatch)
    .then(response => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      let categories = [];
      let products = [];
      response.forEach(({ first_page, id, title }) => {
        products = products.concat(first_page.results);
        categories = categories.concat({ first_page, id, title });
      });

      return dispatch({
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: [products, categories],
      });
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
