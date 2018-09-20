// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { fetchVersion } from 'products/actions';
import { gatekeeper } from 'products/utils';

import BodyContainer from 'components/bodyContainer';
import ProductHeader from 'components/products/header';
import ProductNotFound from 'components/products/product404';

import type { Match } from 'react-router-dom';

import type { AppState } from 'app/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

let ProductDetail = ({ product }: { product: ProductType | null }) => {
  const blocked = gatekeeper({ product });
  if (blocked !== false) {
    return blocked;
  }
  // This redundant check is required to satisfy Flow:
  // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
  /* istanbul ignore if */
  if (!product) {
    return <ProductNotFound />;
  }
  const version = product.most_recent_version;
  return <Redirect to={routes.version_detail(product.slug, version.label)} />;
};

const BodySection = ({ children }: { children: React.Node }) => (
  <div
    className="slds-text-longform
      slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
  >
    {children}
  </div>
);

let VersionDetail = ({
  product,
  version,
  versionLabel,
  doFetchVersion,
}: {
  product: ProductType | null,
  version: VersionType | null,
  versionLabel: ?string,
  doFetchVersion: typeof fetchVersion,
}) => {
  const blocked = gatekeeper({
    product,
    version,
    versionLabel,
    doFetchVersion,
  });
  if (blocked !== false) {
    return blocked;
  }
  // this redundant check is required to satisfy Flow:
  // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
  /* istanbul ignore if */
  if (!product || !version) {
    return <ProductNotFound />;
  }
  return (
    <DocumentTitle title={`${product.title} | MetaDeploy`}>
      <div>
        <ProductHeader product={product} version={version} />
        <BodyContainer>
          <BodySection>
            <h3 className="slds-text-heading_small">
              Select a Plan to Install
            </h3>
            <p>{version.description}</p>
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
            {version.secondary_plan ? (
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
            {version.additional_plans.length ? (
              <div className="slds-p-top_x-large">
                <h3 className="slds-text-heading_small">Additional Plans</h3>
                {version.additional_plans.map(plan => (
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
            <h3 className="slds-text-heading_small">About {product.title}</h3>
            {product.image ? (
              <img
                className="slds-size_full"
                src={product.image}
                alt={product.title}
              />
            ) : null}
            <p>{product.description}</p>
          </BodySection>
        </BodyContainer>
      </div>
    </DocumentTitle>
  );
};

export const selectProduct = (
  appState: AppState,
  { match: { params } }: { match: Match },
): ProductType | null => {
  const product = appState.products.find(p => p.slug === params.productSlug);
  return product || null;
};

export const selectVersionLabel = (
  appState: AppState,
  { match: { params } }: { match: Match },
): ?string => params.versionLabel;

export const selectVersion = createSelector(
  [selectProduct, selectVersionLabel],
  (product: ProductType | null, versionLabel: ?string): VersionType | null => {
    if (!product || !versionLabel) {
      return null;
    }
    if (product.most_recent_version.label === versionLabel) {
      return product.most_recent_version;
    }
    if (product.versions && product.versions[versionLabel]) {
      return product.versions[versionLabel];
    }
    return null;
  },
);

const selectProductDetail = (appState, props) => ({
  product: selectProduct(appState, props),
});

const selectVersionDetail = (appState, props) => ({
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
};

ProductDetail = connect(selectProductDetail)(ProductDetail);
VersionDetail = connect(
  selectVersionDetail,
  actions,
)(VersionDetail);

export { ProductDetail, VersionDetail };
