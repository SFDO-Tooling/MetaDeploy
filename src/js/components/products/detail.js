// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { fetchVersion } from 'products/actions';
import { selectUserState } from 'components/header';
import { shouldFetchVersion, getLoadingOrNotFound } from 'products/utils';

import BodyContainer from 'components/bodyContainer';
import Header from 'components/products/header';
import ProductNotAllowed from 'components/products/notAllowed';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';
import type { User as UserType } from 'accounts/reducer';

type ProductDetailProps = { product: ProductType | null };
type VersionDetailProps = {
  user: UserType,
  product: ProductType | null,
  version: VersionType | null,
  versionLabel: ?string,
  doFetchVersion: typeof fetchVersion,
};

const ProductDetail = ({ product }: ProductDetailProps) => {
  const loadingOrNotFound = getLoadingOrNotFound({ product });
  if (loadingOrNotFound !== false) {
    return loadingOrNotFound;
  }
  // This redundant check is required to satisfy Flow:
  // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
  /* istanbul ignore if */
  if (!product) {
    return <ProductNotFound />;
  }
  if (!product.most_recent_version) {
    return <VersionNotFound product={product} />;
  }
  const version = product.most_recent_version;
  return <Redirect to={routes.version_detail(product.slug, version.label)} />;
};

const BodySection = ({ children }: { children: ?React.Node }) => (
  <div
    className="slds-text-longform
      slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
  >
    {children}
  </div>
);

class VersionDetail extends React.Component<VersionDetailProps> {
  fetchVersionIfMissing() {
    const { product, version, versionLabel, doFetchVersion } = this.props;
    if (
      product &&
      versionLabel &&
      shouldFetchVersion({ product, version, versionLabel })
    ) {
      // Fetch version from API
      doFetchVersion({ product: product.id, label: versionLabel });
    }
  }

  componentDidMount() {
    this.fetchVersionIfMissing();
  }

  componentDidUpdate(prevProps) {
    const { product, version, versionLabel } = this.props;
    const versionChanged =
      product !== prevProps.product ||
      version !== prevProps.version ||
      versionLabel !== prevProps.versionLabel;
    if (versionChanged) {
      this.fetchVersionIfMissing();
    }
  }

  render(): React.Node {
    const { user, product, version, versionLabel } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      version,
      versionLabel,
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // this redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
    /* istanbul ignore if */
    if (!product || !version) {
      return <ProductNotFound />;
    }
    const listedAdditionalPlans = version.additional_plans.filter(
      plan => plan.is_listed && plan.is_allowed,
    );
    return (
      <DocumentTitle title={`${product.title} | MetaDeploy`}>
        <>
          <Header product={product} versionLabel={version.label} />
          {product.is_allowed ? (
            <BodyContainer>
              <BodySection>
                <h3 className="slds-text-heading_small">
                  Select a Plan to Install
                </h3>
                <p>{version.description}</p>
                {version.primary_plan.is_listed &&
                version.primary_plan.is_allowed ? (
                  <p>
                    <Link
                      to={routes.plan_detail(
                        product.slug,
                        version.label,
                        version.primary_plan.slug,
                      )}
                      className="slds-button
                        slds-button_brand
                        slds-size_full"
                    >
                      {version.primary_plan.title}
                    </Link>
                  </p>
                ) : null}
                {version.secondary_plan &&
                version.secondary_plan.is_listed &&
                version.secondary_plan.is_allowed ? (
                  <p>
                    <Link
                      to={routes.plan_detail(
                        product.slug,
                        version.label,
                        version.secondary_plan.slug,
                      )}
                      className="slds-button
                        slds-button_outline-brand
                        slds-size_full"
                    >
                      {version.secondary_plan.title}
                    </Link>
                  </p>
                ) : null}
                {listedAdditionalPlans.length ? (
                  <div className="slds-p-top_x-large">
                    <h3 className="slds-text-heading_small">
                      Additional Plans
                    </h3>
                    {listedAdditionalPlans.map(plan => (
                      <p key={plan.id}>
                        <Link
                          to={routes.plan_detail(
                            product.slug,
                            version.label,
                            plan.slug,
                          )}
                        >
                          {plan.title}
                        </Link>
                      </p>
                    ))}
                  </div>
                ) : null}
              </BodySection>
              <BodySection>
                <h3 className="slds-text-heading_small">
                  About {product.title}
                </h3>
                {product.image ? (
                  <img
                    className="slds-size_full"
                    src={product.image}
                    alt={product.title}
                  />
                ) : null}
                {/* This description is pre-cleaned by the API */}
                <div
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </BodySection>
            </BodyContainer>
          ) : (
            <ProductNotAllowed
              isLoggedIn={user !== null}
              message={product.not_allowed_instructions}
              link={
                <>
                  Try the{' '}
                  <Link to={routes.product_list()}>list of all products</Link>
                </>
              }
            />
          )}
        </>
      </DocumentTitle>
    );
  }
}

export const selectProduct = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ProductType | null => {
  const product = appState.products.find(p => p.slug === params.productSlug);
  return product || null;
};

export const selectVersionLabel = (
  appState: AppState,
  { match: { params } }: InitialProps,
): ?string => params.versionLabel;

export const selectVersion: (
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

const selectProductDetail = (appState: AppState, props: InitialProps) => ({
  product: selectProduct(appState, props),
});

const selectVersionDetail = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
};

const WrappedProductDetail: React.ComponentType<InitialProps> = connect(
  selectProductDetail,
)(ProductDetail);
const WrappedVersionDetail: React.ComponentType<InitialProps> = connect(
  selectVersionDetail,
  actions,
)(VersionDetail);

export {
  WrappedProductDetail as ProductDetail,
  WrappedVersionDetail as VersionDetail,
};
