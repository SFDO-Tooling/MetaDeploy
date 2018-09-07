// @flow

import type { Plan, Plans } from 'plans/reducer';
import type { ProductsAction } from 'products/actions';

export type Version = {
  +id: number,
  +product: number,
  +label: string,
  +description: string,
  +created_at: string,
  +primary_plan: Plan,
  +secondary_plan: Plan | null,
  +additional_plans: Plans,
};
export type Product = {
  +id: number,
  +title: string,
  +description: string,
  +category: string,
  +color: string,
  +icon: {
    +type: 'url' | 'slds',
    +category?: 'action' | 'custom' | 'doctype' | 'standard' | 'utility',
    +name?: string,
    +url?: string,
  } | null,
  +image_url: string,
  +most_recent_version: Version,
};
export type Products = Array<Product>;

const reducer = (state: Products = [], action: ProductsAction): Products => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_SUCCEEDED':
      return action.payload;
  }
  return state;
};

export default reducer;
