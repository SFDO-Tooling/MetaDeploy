// @flow

import { createSelector } from 'reselect';

import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type {
  Product as ProductType,
  Products as ProductsType,
  Version as VersionType,
} from 'store/products/reducer';

export type ProductsMapType = Map<string, Array<ProductType>>;

type VersionPlanType = {
  +label: string,
  +slug: string,
};

const selectProductsState = (appState: AppState): ProductsType =>
  appState.products;

const selectProductsByCategory: AppState => ProductsMapType = createSelector(
  selectProductsState,
  (products: ProductsType): ProductsMapType => {
    const productsByCategory = new Map();
    for (const product of products) {
      if (
        product.is_allowed &&
        product.is_listed &&
        product.most_recent_version
      ) {
        const category = product.category;
        const existing = productsByCategory.get(category) || [];
        existing.push(product);
        productsByCategory.set(category, existing);
      }
    }
    return productsByCategory;
  },
);

const selectProductCategories: AppState => Array<string> = createSelector(
  selectProductsByCategory,
  (productsByCategory: ProductsMapType): Array<string> => [
    ...productsByCategory.keys(),
  ],
);

const selectProduct = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ProductType | null => {
  const product = appState.products.find(p => p.slug === params.productSlug);
  return product || null;
};

const selectVersionLabel = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.versionLabel;

const selectVersion: (
  AppState,
  InitialProps,
) => VersionType | null = createSelector(
  [selectProduct, selectVersionLabel],
  (product: ProductType | null, versionLabel: ?string): VersionType | null => {
    if (!product || !versionLabel) {
      return null;
    }
    if (
      product.most_recent_version &&
      product.most_recent_version.label === versionLabel
    ) {
      return product.most_recent_version;
    }
    if (product.versions && product.versions[versionLabel]) {
      return product.versions[versionLabel];
    }
    return null;
  },
);

const selectVersionOrPlan: (
  AppState,
  InitialProps,
) => VersionPlanType = createSelector(
  [selectProduct, selectVersionLabel],
  (
    product: ProductType | null,
    maybeVersionLabel: ?string,
  ): VersionPlanType => {
    // There's a chance that the versionLabel is really a planSlug.
    // In that case, check the most recent version in the product and see.
    if (
      product &&
      product.most_recent_version &&
      product.most_recent_version.primary_plan &&
      product.most_recent_version.secondary_plan &&
      product.most_recent_version.additional_plans
    ) {
      const slugs = [
        product.most_recent_version.primary_plan.slug,
        product.most_recent_version.secondary_plan.slug,
        ...product.most_recent_version.additional_plans.map(e => e.slug),
      ];
      if (slugs.includes(maybeVersionLabel)) {
        return {
          // This is never missing, because of the surrounding
          // conditional, but flow doesn't seem to understand
          // that.
          label:
            (product.most_recent_version &&
              product.most_recent_version.label) ||
            '',
          slug: maybeVersionLabel || '',
        };
      }
      return {
        label: maybeVersionLabel || '',
        slug: '',
      };
    }
    return {
      label: '',
      slug: '',
    };
  },
);

export {
  selectProductsState,
  selectProductsByCategory,
  selectProductCategories,
  selectProduct,
  selectVersionLabel,
  selectVersion,
  selectVersionOrPlan,
};
