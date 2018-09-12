// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { fetchVersions } from 'products/actions';

import ProductIcon from 'components/products/icon';

import type { Match } from 'react-router-dom';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

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

let ProductDetail = ({ product }: { product: ProductType | null }) => {
  if (!product) {
    return <Redirect to={routes.product_list()} />;
  }
  const version = product.most_recent_version;
  return <Redirect to={routes.version_detail(product.slug, version.slug)} />;
};

let VersionDetail = ({
  product,
  version,
  doFetchVersions,
}: {
  product: ProductType | null,
  version: VersionType | null,
  doFetchVersions: typeof fetchVersions,
}) => {
  if (!product) {
    // No product... redirect to products-list
    return <Redirect to={routes.product_list()} />;
  }
  if (!version) {
    if (product.versions) {
      // Versions have already been fetched... redirect to product-detail
      return <Redirect to={routes.product_detail(product.slug)} />;
    }
    // Fetch version from API
    doFetchVersions(product.id);
    return <Spinner />;
  }
  return (
    <DocumentTitle title={`${product.title} | MetaDeploy`}>
      <div>
        <PageHeader
          className="page-header
            slds-p-around_x-large"
          title={product.title}
          info={version.label}
          icon={<ProductIcon item={product} />}
        />
        <div
          className="slds-p-around_medium
            slds-grid
            slds-wrap"
        >
          <BodySection>
            <h3 className="slds-text-heading_small">
              Select a Plan to Install
            </h3>
            <p>{version.description}</p>
            <p>
              <a
                className="slds-button
                  slds-button_brand
                  slds-size_full"
              >
                {version.primary_plan.title}
              </a>
            </p>
            {version.secondary_plan ? (
              <p>
                <a
                  className="slds-button
                    slds-button_outline-brand
                    slds-size_full"
                >
                  {version.secondary_plan.title}
                </a>
              </p>
            ) : null}
            {version.additional_plans.length ? (
              <div className="slds-p-top_x-large">
                <h3 className="slds-text-heading_small">Additional Plans</h3>
                {version.additional_plans.map(plan => (
                  <p key={plan.id}>
                    <a>{plan.title}</a>
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
        </div>
      </div>
    </DocumentTitle>
  );
};

const selectProduct = (
  appState,
  { match: { params } }: { match: Match },
): ProductType | null => {
  const product = appState.products.find(p => p.slug === params.productSlug);
  if (!product) {
    // Will redirect back to products-list
    return null;
  }
  // Will redirect to most_recent_version detail
  return product;
};

const selectVersionSlug = (
  appState,
  { match: { params } }: { match: Match },
): ?string => params.versionSlug;

const selectVersion = createSelector(
  [selectProduct, selectVersionSlug],
  (product: ProductType | null, versionSlug: ?string): VersionType | null => {
    if (!product) {
      // Will redirect back to products-list
      return null;
    }
    if (product.most_recent_version.slug === versionSlug) {
      // Will display version-detail
      return product.most_recent_version;
    }
    if (product.versions) {
      const version = product.versions.find(v => v.slug === versionSlug);
      if (!version) {
        // Will redirect back to product-detail
        return null;
      }
      // Will display version-detail
      return version;
    }
    // Will fetch product versions from API
    return null;
  },
);

const selectProductDetail = (appState, props) => ({
  product: selectProduct(appState, props),
});

const selectVersionDetail = (appState, props) => ({
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
});

const actions = {
  doFetchVersions: fetchVersions,
};

ProductDetail = connect(selectProductDetail)(ProductDetail);
VersionDetail = connect(
  selectVersionDetail,
  actions,
)(VersionDetail);

export { ProductDetail, VersionDetail };
