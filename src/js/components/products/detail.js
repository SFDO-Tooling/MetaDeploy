// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';

import ProductIcon from 'components/products/icon';

import type { Match } from 'react-router-dom';
import type { Products as ProductsType } from 'products/reducer';

const ProductDetail = ({
  match: { params },
  products,
}: {
  match: Match,
  products: ProductsType,
}) => {
  const id = parseInt(params.id, 10);
  const product = products.find(p => p.id === id);
  if (!product) {
    return <Redirect to={routes.product_list()} />;
  }
  const BodySection = ({ children }: { children: React.Node }) => (
    <div
      className="slds-text-longform
        slds-p-vertical_small
        slds-p-horizontal_x-large
        slds-size_1-of-1
        slds-medium-size_1-of-2"
    >
      {children}
    </div>
  );
  return (
    <DocumentTitle title={`${product.title} | MetaDeploy`}>
      <div>
        <PageHeader
          className="page-header
            slds-p-around_large"
          title={product.title}
          info={product.version}
          icon={<ProductIcon item={product} />}
        />
        <div
          className="slds-p-horizontal_x-large
            slds-p-vertical_medium
            slds-grid
            slds-wrap"
        >
          <BodySection>
            <h3 className="slds-text-heading_small">
              Select a Plan to Install
            </h3>
            <p>
              Any description needed for the various plans? Lorem Ipsum is
              simply dummy text of the printing and typesetting industry.
            </p>
            <p>
              <Button
                className="slds-size_full"
                label={`Latest Production (${product.version})`}
                variant="brand"
              />
            </p>
            <p>
              <Button
                className="slds-size_full slds-button_outline-brand"
                label="Latest Beta (3.3.0-beta.4)"
                variant="base"
              />
            </p>
            <div className="slds-p-top_large">
              <h3 className="slds-text-heading_small">
                Additional Plan Options
              </h3>
              <ul>
                <li>
                  <a>Previous Production (3.2.0)</a>
                </li>
                <li>
                  <a>Previous Beta (3.3.0-beta.3)</a>
                </li>
                <li>
                  <a>Earlier Production with Longer Title (3.1.2)</a>
                </li>
              </ul>
            </div>
          </BodySection>
          <BodySection>
            <h3 className="slds-text-heading_small">About {product.title}</h3>
            <img
              className="slds-size_full"
              src="https://placekitten.com/g/300/150"
            />
            <p>{product.description}</p>
          </BodySection>
        </div>
      </div>
    </DocumentTitle>
  );
};

const selectProductsState = (appState): ProductsType => appState.products;

const select = appState => ({
  products: selectProductsState(appState),
});

export default connect(select)(ProductDetail);
