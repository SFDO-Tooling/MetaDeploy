// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';

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
  return product ? (
    <DocumentTitle title={`${product.title} | MetaDeploy`}>
      <div>{product.title}</div>
    </DocumentTitle>
  ) : (
    <Redirect to={routes.product_list()} />
  );
};

const selectProductsState = (appState): ProductsType => appState.products;

const select = appState => ({
  products: selectProductsState(appState),
});

export default connect(select)(ProductDetail);
