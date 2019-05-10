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

export type VersionPlanType = {
  +label: string | null,
  +slug: string | null,
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

const selectProductSlug = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.productSlug;

const selectProduct: (
  AppState,
  InitialProps,
) => ProductType | null = createSelector(
  [selectProductsState, selectProductSlug],
  (products: ProductsType, productSlug: ?string): ProductType | null => {
    if (!productSlug) {
      return null;
    }
    const product = products.find(
      p => p.slug === productSlug || p.old_slugs.includes(productSlug),
    );
    return product || null;
  },
);

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

const selectVersionLabelOrPlanSlug: (
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
    if (!product || !maybeVersionLabel) {
      return { label: null, slug: null };
    }
    const version = product.most_recent_version;
    if (version) {
      const slugs = [];
      if (version.primary_plan) {
        slugs.push(version.primary_plan.slug);
      }
      if (version.secondary_plan) {
        slugs.push(version.secondary_plan.slug);
      }
      // @@@ This isn't quite right... we'll need to fetch the list of
      // additional_plans for this version if we haven't yet.
      if (version.additional_plans) {
        slugs.push(
          Object.entries(version.additional_plans).forEach(
            ([key, value]) => value.slug,
          ),
        );
      }
      if (slugs.includes(maybeVersionLabel)) {
        return {
          label: version.label,
          slug: maybeVersionLabel,
        };
      }
    }
    return {
      label: maybeVersionLabel,
      slug: null,
    };
  },
);

export {
  selectProductsState,
  selectProductsByCategory,
  selectProductCategories,
  selectProductSlug,
  selectProduct,
  selectVersionLabel,
  selectVersion,
  selectVersionLabelOrPlanSlug,
};
