// @flow

import type { ThunkAction } from 'redux-thunk';

import apiFetch, { addUrlParams } from 'utils/api';
import type { Category, Product, Version } from 'store/products/reducer';
import type { Plan } from 'store/plans/reducer';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED',
  payload: { products: Array<Product>, categories: Array<Category> },
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
type FetchMoreProductsStarted = {
  type: 'FETCH_MORE_PRODUCTS_STARTED',
  payload: { url: string, id: number },
};
type FetchMoreProductsSucceeded = {
  type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
  payload: { products: Array<Product>, category: number, next: string | null },
};
type FetchMoreProductsFailed = {
  type: 'FETCH_MORE_PRODUCTS_FAILED',
  payload: { url: string, id: number },
};
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
  | FetchMoreProductsStarted
  | FetchMoreProductsSucceeded
  | FetchMoreProductsFailed
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

export const fetchProducts = (): ThunkAction => (dispatch) => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  const baseUrl = window.api_urls.productcategory_list();
  return apiFetch(baseUrl, dispatch)
    .then((response) => {
      if (!Array.isArray(response)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      let products = [];
      let categories = [];
      response.forEach(({ id, title, first_page }) => {
        products = products.concat(first_page.results);
        categories = categories.concat({ id, title, next: first_page.next });
      });

      return dispatch({
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: { products, categories },
      });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_PRODUCTS_FAILED' });
      throw err;
    });
};

export const fetchMoreProducts = ({
  url,
  id,
}: {
  url: string,
  id: number,
}): ThunkAction => (dispatch) => {
  dispatch({ type: 'FETCH_MORE_PRODUCTS_STARTED', payload: { url, id } });
  return apiFetch(url, dispatch)
    .then((response) => {
      const products = response.results;
      if (!Array.isArray(response.results)) {
        const error = (new Error('Invalid response received'): {
          [string]: mixed,
        });
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
        payload: { products, category: id, next: response.next },
      });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_MORE_PRODUCTS_FAILED', payload: { url, id } });
      throw err;
    });
};

export const fetchProduct = (filters: ProductFilters): ThunkAction => (
  dispatch,
) => {
  dispatch({ type: 'FETCH_PRODUCT_STARTED', payload: filters });
  const baseUrl = window.api_urls.product_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then((response) =>
      dispatch({
        type: 'FETCH_PRODUCT_SUCCEEDED',
        payload: { ...filters, product: response || null },
      }),
    )
    .catch((err) => {
      dispatch({ type: 'FETCH_PRODUCT_FAILED', payload: filters });
      throw err;
    });
};

export const fetchVersion = (filters: VersionFilters): ThunkAction => (
  dispatch,
) => {
  dispatch({ type: 'FETCH_VERSION_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then((response) =>
      dispatch({
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { ...filters, version: response || null },
      }),
    )
    .catch((err) => {
      dispatch({ type: 'FETCH_VERSION_FAILED', payload: filters });
      throw err;
    });
};

export const fetchAdditionalPlans = (filters: {
  product: string,
  version: string,
}): ThunkAction => (dispatch) => {
  dispatch({ type: 'FETCH_ADDITIONAL_PLANS_STARTED', payload: filters });
  const baseUrl = window.api_urls.version_additional_plans(filters.version);
  return apiFetch(baseUrl, dispatch)
    .then((response) => {
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
    .catch((err) => {
      dispatch({ type: 'FETCH_ADDITIONAL_PLANS_FAILED', payload: filters });
      throw err;
    });
};

export const fetchPlan = (filters: PlanFilters): ThunkAction => (dispatch) => {
  dispatch({ type: 'FETCH_PLAN_STARTED', payload: filters });
  const baseUrl = window.api_urls.plan_get_one();
  return apiFetch(addUrlParams(baseUrl, { ...filters }), dispatch)
    .then((response) =>
      dispatch({
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { ...filters, plan: response || null },
      }),
    )
    .catch((err) => {
      dispatch({ type: 'FETCH_PLAN_FAILED', payload: filters });
      throw err;
    });
};
