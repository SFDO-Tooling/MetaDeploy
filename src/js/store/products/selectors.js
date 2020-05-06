// @flow

import { createSelector } from 'reselect';

import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type { Plan as PlanType } from 'store/plans/reducer';
import type {
  Category,
  Product,
  ProductsState,
  Version,
} from 'store/products/reducer';

export type ProductsMapType = Map<string, Array<Product>>;

export type VersionPlanType = {
  +label?: string | null,
  +slug?: string | null,
  +maybeVersion?: string,
  +maybeSlug?: string,
};

const selectProductsState = (appState: AppState): ProductsState =>
  appState.products;

const selectProducts: (AppState) => Array<Product> = createSelector(
  selectProductsState,
  (products: ProductsState): Array<Product> => products.products,
);

const selectProductCategories: (AppState) => Array<Category> = createSelector(
  selectProductsState,
  (products: ProductsState): Array<Category> => products.categories,
);

const selectProductsByCategory: (AppState) => ProductsMapType = createSelector(
  [selectProducts, selectProductCategories],
  (products: Array<Product>, categories: Array<Category>): ProductsMapType => {
    const productsByCategory = new Map();
    for (const category of categories) {
      productsByCategory.set(
        category.title,
        products.filter(
          (product) =>
            product.is_allowed &&
            product.is_listed &&
            product.most_recent_version &&
            product.category === category.title,
        ),
      );
    }
    return productsByCategory;
  },
);

const selectProductSlug = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.productSlug;

const selectProductNotFound: (
  AppState,
  InitialProps,
) => boolean = createSelector(
  [selectProductsState, selectProductSlug],
  (products: ProductsState, productSlug: ?string): boolean =>
    Boolean(productSlug && products.notFound.includes(productSlug)),
);

const selectProduct: (
  AppState,
  InitialProps,
) => Product | null | void = createSelector(
  [selectProducts, selectProductSlug, selectProductNotFound],
  (
    products: Array<Product>,
    productSlug: ?string,
    notFound: boolean,
  ): Product | null | void => {
    if (!productSlug) {
      return undefined;
    }
    const product = products.find(
      (p) => p.slug === productSlug || p.old_slugs.includes(productSlug),
    );
    if (product) {
      return product;
    }
    return notFound ? null : undefined;
  },
);

const selectVersionLabel = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.versionLabel;

const selectVersion: (
  AppState,
  InitialProps,
) => Version | null = createSelector(
  [selectProduct, selectVersionLabel],
  (product: Product | null | void, versionLabel: ?string): Version | null => {
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
  [selectProduct, selectVersion, selectVersionLabel],
  (
    product: Product | null | void,
    version: Version | null,
    maybeVersionLabel: ?string,
  ): VersionPlanType => {
    // There's a chance that the versionLabel is really a planSlug.
    // Check the most recent version in the product and see.
    if (!product || !maybeVersionLabel) {
      return { label: null, slug: null };
    }
    const { most_recent_version } = product;
    if (!version && most_recent_version) {
      const slugs = [];
      /* istanbul ignore else */
      if (most_recent_version.primary_plan) {
        slugs.push(most_recent_version.primary_plan.slug);
      }
      /* istanbul ignore else */
      if (most_recent_version.secondary_plan) {
        slugs.push(most_recent_version.secondary_plan.slug);
      }
      /* istanbul ignore else */
      if (most_recent_version.additional_plans) {
        // Add all slugs (current and old) from all known plans
        slugs.push(
          ...(Object.entries(most_recent_version.additional_plans): any)
            .filter((item: Array<[string, PlanType | null]>) => item[1])
            .map((item: Array<[string, PlanType]>) => item[0]),
        );
      }
      if (slugs.includes(maybeVersionLabel)) {
        return {
          label: most_recent_version.label,
          slug: maybeVersionLabel,
        };
      }
      if (
        !(
          most_recent_version.additional_plans &&
          most_recent_version.additional_plans[maybeVersionLabel] === null
        )
      ) {
        // Check to see if plan exists on version...
        return {
          maybeVersion: most_recent_version.id,
          maybeSlug: maybeVersionLabel,
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
  selectProductCategories,
  selectProductsByCategory,
  selectProductSlug,
  selectProduct,
  selectProductNotFound,
  selectVersionLabel,
  selectVersion,
  selectVersionLabelOrPlanSlug,
};
