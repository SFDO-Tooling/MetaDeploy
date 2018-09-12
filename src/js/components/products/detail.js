// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';

import ProductIcon from 'components/products/icon';

import type { Match } from 'react-router-dom';
import type { Product as ProductType } from 'products/reducer';

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

const ProductDetail = ({ product }: { product: ProductType | void }) => {
  if (product === undefined) {
    return <Redirect to={routes.product_list()} />;
  }
  const version = product.most_recent_version;
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
): ProductType | void => {
  const products = appState.products;
  const id = parseInt(params.id, 10);
  return products.find(p => p.id === id);
};

const select = (appState, props) => ({
  product: selectProduct(appState, props),
});

export default connect(select)(ProductDetail);
