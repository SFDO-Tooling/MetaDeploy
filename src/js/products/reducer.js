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
export type Versions = Array<Version>;
export type Product = {
  +id: number,
  +slug: string,
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
  +image: string | null,
  +most_recent_version: Version,
  +versions?: { [string]: Version | null },
};
export type Products = Array<Product>;

const reducer = (products: Products = [], action: ProductsAction): Products => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_SUCCEEDED':
      return action.payload;
    case 'FETCH_VERSION_SUCCEEDED': {
      const { product, label, version } = action.payload;
      return products.map(p => {
        if (p.id === product) {
          const versions = Object.assign({}, p.versions, {
            [label]: version,
          });
          return Object.assign({}, p, {
            versions,
          });
        }
        return p;
      });
    }
  }
  return products;
};

export default reducer;
