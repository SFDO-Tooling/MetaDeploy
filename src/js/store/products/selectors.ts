import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { Plan } from '@/store/plans/reducer';
import {
  Category,
  Product,
  ProductsState,
  Version,
} from '@/store/products/reducer';

export type ProductsMapType = Map<string, Product[]>;

export type VersionPlanType = {
  readonly label?: string | null;
  readonly slug?: string | null;
  readonly maybeVersion?: string;
  readonly maybeSlug?: string;
};

const selectProductsState = (appState: AppState): ProductsState =>
  appState.products;

const selectProducts = createSelector(
  selectProductsState,
  (products: ProductsState): Product[] => products.products,
);

const selectProductCategories = createSelector(
  selectProductsState,
  (products: ProductsState): Category[] => products.categories,
);

const selectProductsByCategory: (
  appState: AppState,
) => ProductsMapType = createSelector(
  [selectProducts, selectProductCategories],
  (products: Product[], categories: Category[]): ProductsMapType => {
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
  { match: { params } }: RouteComponentProps<{ productSlug?: string }>,
): string | null | undefined => params.productSlug;

const selectProductNotFound = createSelector(
  [selectProductsState, selectProductSlug],
  (products: ProductsState, productSlug: string | null | undefined): boolean =>
    Boolean(productSlug && products.notFound.includes(productSlug)),
);

const selectProduct = createSelector(
  [selectProducts, selectProductSlug, selectProductNotFound],
  (
    products: Product[],
    productSlug: string | null | undefined,
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
  { match: { params } }: RouteComponentProps<{ versionLabel?: string }>,
): string | null | undefined => params.versionLabel;

const selectVersion = createSelector(
  [selectProduct, selectVersionLabel],
  (
    product: Product | null | void,
    versionLabel: string | null | undefined,
  ): Version | null => {
    if (!product || !versionLabel) {
      return null;
    }
    if (
      product.most_recent_version &&
      product.most_recent_version.label === versionLabel
    ) {
      return product.most_recent_version;
    }
    if (product.versions?.[versionLabel]) {
      return product.versions[versionLabel];
    }
    return null;
  },
);

const selectVersionLabelOrPlanSlug = createSelector(
  [selectProduct, selectVersion, selectVersionLabel],
  (
    product: Product | null | void,
    version: Version | null,
    maybeVersionLabel: string | null | undefined,
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
          ...(Object.entries(most_recent_version.additional_plans) as any)
            .filter((item: [string, Plan | null][]) => item[1])
            .map((item: [string, Plan][]) => item[0]),
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
