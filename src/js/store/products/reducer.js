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
export type Category = {
  +id: number,
  +title: string,
  +next: string | null,
};
export type ProductsState = {
  +products: Array<Product>,
  +notFound: Array<string>,
  +categories: Array<Category>,
};

const reducer = (
  products: ProductsState = {
    products: [],
    notFound: [],
    categories: [],
  },
  action: ProductsAction,
): ProductsState => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_SUCCEEDED': {
      const { products: fetchedProducts, categories } = action.payload;
      return {
        ...products,
        products: fetchedProducts,
        categories,
      };
    }
    case 'FETCH_MORE_PRODUCTS_SUCCEEDED': {
      const { products: fetchedProducts, category, next } = action.payload;
      // Store list of known product IDs to filter out duplicates
      const ids = products.products.map(p => p.id);
      return {
        ...products,
        products: [
          ...products.products,
          ...fetchedProducts.filter(p => !ids.includes(p.id)),
        ],
        categories: products.categories.map(c => {
          if (c.id === category) {
            return { ...c, next };
          }
          return c;
        }),
      };
    }
    case 'FETCH_PRODUCT_SUCCEEDED': {
      const { product, slug } = action.payload;
      if (product) {
        return { ...products, products: [...products.products, product] };
      }
      return { ...products, notFound: [...products.notFound, slug] };
    }
    case 'FETCH_VERSION_SUCCEEDED': {
      const { product, label, version } = action.payload;
      return {
        ...products,
        products: products.products.map(p => {
          if (p.id === product) {
            const versions = { ...p.versions, [label]: version };
            return { ...p, versions };
          }
          return p;
        }),
      };
    }
    case 'FETCH_ADDITIONAL_PLANS_SUCCEEDED': {
      const { product, version, plans } = action.payload;
      const additional_plans = plans.reduce((obj, item) => {
        obj[item.slug] = item;
        for (const oldSlug of item.old_slugs) {
          obj[oldSlug] = item;
        }
        return obj;
      }, {});
      return {
        ...products,
        products: products.products.map(p => {
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
              const thisVersion: ?Version = (Object.values(
                p.versions,
              ): any).find(
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
          return p;
        }),
      };
    }
    case 'FETCH_PLAN_SUCCEEDED': {
      const { product, version, slug, plan } = action.payload;
      const additional_plans = { [slug]: plan };
      if (plan && plan.old_slugs) {
        for (const oldSlug of plan.old_slugs) {
          additional_plans[oldSlug] = plan;
        }
      }
      return {
        ...products,
        products: products.products.map(p => {
          if (p.id === product) {
            if (p.most_recent_version && p.most_recent_version.id === version) {
              return {
                ...p,
                most_recent_version: {
                  ...p.most_recent_version,
                  additional_plans: {
                    ...p.most_recent_version.additional_plans,
                    ...additional_plans,
                  },
                },
              };
            } else if (p.versions) {
              const thisVersion: ?Version = (Object.values(
                p.versions,
              ): any).find(
                (v: Version | null) => v !== null && v.id === version,
              );
              if (thisVersion) {
                return {
                  ...p,
                  versions: {
                    ...p.versions,
                    [thisVersion.label]: {
                      ...thisVersion,
                      additional_plans: {
                        ...thisVersion.additional_plans,
                        ...additional_plans,
                      },
                    },
                  },
                };
              }
            }
          }
          return p;
        }),
      };
    }
  }
  return products;
};

export default reducer;
