// @flow

import type { Plan, Plans } from 'plans/reducer';
import type { ProductsAction } from 'products/actions';

export type Version = {
  +id: string,
  +product: string,
  +label: string,
  +description: string,
  +created_at: string,
  +primary_plan: Plan,
  +secondary_plan: Plan | null,
  +additional_plans: Plans,
  +is_listed: boolean,
};
export type Product = {
  +id: string,
  +slug: string,
  +title: string,
  +description: string | null,
  +short_description: string,
  +category: string,
  +color: string,
  +icon: {
    +type: 'url' | 'slds',
    +category?: 'action' | 'custom' | 'doctype' | 'standard' | 'utility',
    +name?: string,
    +url?: string,
  } | null,
  +image: string | null,
  +most_recent_version: Version | null,
  +versions?: { [string]: Version | null },
  +is_listed: boolean,
  +is_allowed: boolean,
  +not_allowed_instructions: string | null,
  +click_through_agreement: string | null,
};
export type Products = Array<Product>;

const reducer = (products: Products = [], action: ProductsAction): Products => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_SUCCEEDED':
      return action.payload;
    case 'FETCH_PRODUCTS_FAILED':
      return [];
    case 'FETCH_VERSION_SUCCEEDED': {
      const { product, label, version } = action.payload;
      return products.map(p => {
        if (p.id === product) {
          const versions = { ...p.versions, [label]: version };
          return { ...p, versions };
        }
        return p;
      });
    }
  }
  return products;
};

export default reducer;
