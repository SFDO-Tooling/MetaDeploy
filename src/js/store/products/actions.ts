import { omit } from 'lodash';

import { ThunkResult } from '@/js/store';
import { Plan } from '@/js/store/plans/reducer';
import {
  ApiCategory,
  Category,
  Product,
  Version,
} from '@/js/store/products/reducer';
import apiFetch, { addUrlParams, ApiError } from '@/js/utils/api';

type FetchProductsStarted = { type: 'FETCH_PRODUCTS_STARTED' };
export type FetchProductsSucceeded = {
  type: 'FETCH_PRODUCTS_SUCCEEDED';
  payload: { products: Product[]; categories: Category[] };
};
type FetchProductsFailed = { type: 'FETCH_PRODUCTS_FAILED' };
type FetchMoreProductsStarted = {
  type: 'FETCH_MORE_PRODUCTS_STARTED';
  payload: { url: string; id: number };
};
type FetchMoreProductsSucceeded = {
  type: 'FETCH_MORE_PRODUCTS_SUCCEEDED';
  payload: { products: Product[]; category: number; next: string | null };
};
type FetchMoreProductsFailed = {
  type: 'FETCH_MORE_PRODUCTS_FAILED';
  payload: { url: string; id: number };
};
type ProductFilters = {
  slug: string;
};
type FetchProductStarted = {
  type: 'FETCH_PRODUCT_STARTED';
  payload: ProductFilters;
};
type FetchProductSucceeded = {
  type: 'FETCH_PRODUCT_SUCCEEDED';
  payload: ProductFilters & {
    product: Product | null;
  };
};
type FetchProductFailed = {
  type: 'FETCH_PRODUCT_FAILED';
  payload: ProductFilters;
};
type VersionFilters = { product: string; label: string };
type FetchVersionStarted = {
  type: 'FETCH_VERSION_STARTED';
  payload: VersionFilters;
};
type FetchVersionSucceeded = {
  type: 'FETCH_VERSION_SUCCEEDED';
  payload: VersionFilters & {
    version: Version | null;
  };
};
type FetchVersionFailed = {
  type: 'FETCH_VERSION_FAILED';
  payload: VersionFilters;
};
type FetchAdditionalPlansStarted = {
  type: 'FETCH_ADDITIONAL_PLANS_STARTED';
  payload: { product: string; version: string };
};
type FetchAdditionalPlansFailed = {
  type: 'FETCH_ADDITIONAL_PLANS_FAILED';
  payload: { product: string; version: string };
};
type FetchAdditionalPlansSucceeded = {
  type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED';
  payload: { product: string; version: string; plans: Plan[] };
};
type PlanFilters = {
  product: string;
  version: string;
  slug: string;
};
type FetchPlanStarted = {
  type: 'FETCH_PLAN_STARTED';
  payload: PlanFilters;
};
type FetchPlanSucceeded = {
  type: 'FETCH_PLAN_SUCCEEDED';
  payload: PlanFilters & {
    plan: Plan | null;
  };
};
type FetchPlanFailed = {
  type: 'FETCH_PLAN_FAILED';
  payload: PlanFilters;
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

export const fetchProducts =
  (): ThunkResult<Promise<FetchProductsSucceeded>> => async (dispatch) => {
    dispatch({ type: 'FETCH_PRODUCTS_STARTED' as const });
    const baseUrl = window.api_urls.productcategory_list();
    try {
      const response = await apiFetch(baseUrl, dispatch);
      if (!Array.isArray(response)) {
        const error: ApiError = new Error('Invalid response received');
        error.response = response;
        throw error;
      }
      let products: Product[] = [];
      let categories: Category[] = [];
      response.forEach((category: ApiCategory) => {
        const { first_page } = category;
        products = products.concat(first_page.results);
        categories = categories.concat({
          ...omit(category, 'first_page'),
          next: first_page.next,
        });
      });
      return dispatch({
        type: 'FETCH_PRODUCTS_SUCCEEDED' as const,
        payload: { products, categories },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_PRODUCTS_FAILED' as const });
      throw err;
    }
  };

export const fetchMoreProducts =
  ({
    url,
    id,
  }: {
    url: string;
    id: number;
  }): ThunkResult<Promise<FetchMoreProductsSucceeded>> =>
  async (dispatch) => {
    dispatch({
      type: 'FETCH_MORE_PRODUCTS_STARTED' as const,
      payload: { url, id },
    });
    try {
      const response = await apiFetch(url, dispatch);
      const products = response.results;
      if (!Array.isArray(response.results)) {
        const error: ApiError = new Error('Invalid response received');
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_MORE_PRODUCTS_SUCCEEDED' as const,
        payload: { products, category: id, next: response.next },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_MORE_PRODUCTS_FAILED' as const,
        payload: { url, id },
      });
      throw err;
    }
  };

export const fetchProduct =
  (filters: ProductFilters): ThunkResult<Promise<FetchProductSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'FETCH_PRODUCT_STARTED' as const, payload: filters });
    const baseUrl = window.api_urls.product_get_one();
    try {
      const response = await apiFetch(
        addUrlParams(baseUrl, { ...filters }),
        dispatch,
      );
      return dispatch({
        type: 'FETCH_PRODUCT_SUCCEEDED' as const,
        payload: { ...filters, product: response || null },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_PRODUCT_FAILED' as const, payload: filters });
      throw err;
    }
  };

export const fetchVersion =
  (filters: VersionFilters): ThunkResult<Promise<FetchVersionSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'FETCH_VERSION_STARTED' as const, payload: filters });
    const baseUrl = window.api_urls.version_get_one();
    try {
      const response = await apiFetch(
        addUrlParams(baseUrl, { ...filters }),
        dispatch,
      );
      return dispatch({
        type: 'FETCH_VERSION_SUCCEEDED' as const,
        payload: { ...filters, version: response || null },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_VERSION_FAILED' as const, payload: filters });
      throw err;
    }
  };

export const fetchAdditionalPlans =
  (filters: {
    product: string;
    version: string;
  }): ThunkResult<Promise<FetchAdditionalPlansSucceeded>> =>
  async (dispatch) => {
    dispatch({
      type: 'FETCH_ADDITIONAL_PLANS_STARTED' as const,
      payload: filters,
    });
    const baseUrl = window.api_urls.version_additional_plans(filters.version);
    try {
      const response = await apiFetch(baseUrl, dispatch);
      if (!Array.isArray(response)) {
        const error: ApiError = new Error('Invalid response received');
        error.response = response;
        throw error;
      }
      return dispatch({
        type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED' as const,
        payload: { ...filters, plans: response },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_ADDITIONAL_PLANS_FAILED' as const,
        payload: filters,
      });
      throw err;
    }
  };

export const fetchPlan =
  (filters: PlanFilters): ThunkResult<Promise<FetchPlanSucceeded>> =>
  async (dispatch) => {
    dispatch({ type: 'FETCH_PLAN_STARTED' as const, payload: filters });
    const baseUrl = window.api_urls.plan_get_one();
    try {
      const response = await apiFetch(
        addUrlParams(baseUrl, { ...filters }),
        dispatch,
      );
      return dispatch({
        type: 'FETCH_PLAN_SUCCEEDED' as const,
        payload: { ...filters, plan: response || null },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_PLAN_FAILED' as const, payload: filters });
      throw err;
    }
  };
