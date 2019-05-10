// @flow

import type { Plan } from 'store/plans/reducer';
import type { ProductsAction } from 'store/products/actions';

export type Version = {
  +id: string,
  +product: string,
  +label: string,
  +description: string,
  +created_at: string,
  +primary_plan: Plan | null,
  +secondary_plan: Plan | null,
  +fetched_additional_plans?: boolean,
  +additional_plans?: { [string]: Plan | null },
  +is_listed: boolean,
};
export type Product = {
  +id: string,
  +slug: string,
  +old_slugs: string[],
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
    case 'FETCH_PLANS_SUCCEEDED': {
      const { product, version, response } = action.payload;
      // const additional_plans = arrToObject(response);
      const additional_plans = response.reduce((obj, item) => {
        obj[item.slug] = item;
        for (const oldSlug of item.old_slugs) {
          obj[oldSlug] = item;
        }
        return obj;
      }, {});
      return products.map(p => {
        if (p.id === product) {
          if (p.most_recent_version && p.most_recent_version.id === version) {
            return {
              ...p,
              most_recent_version: {
                ...p.most_recent_version,
                fetched_additional_plans: true,
                additional_plans,
              },
            };
          } else if (p.versions) {
            const thisVersion: ?Version = (Object.values(p.versions): any).find(
              (v: Version | null) => v !== null && v.id === version,
            );
            if (thisVersion) {
              return {
                ...p,
                versions: {
                  ...p.versions,
                  [thisVersion.label]: {
                    ...thisVersion,
                    fetched_additional_plans: true,
                    additional_plans,
                  },
                },
              };
            }
          }
        }
      });
    }
  }
  return products;
};

export default reducer;
