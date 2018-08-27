// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import { fetchProducts } from 'products/actions';

import type {
  Products as ProductsType,
  Product as ProductType,
} from 'products/reducer';

const selectProductsState = (appState): ProductsType => appState.products;

const select = appState => ({
  products: selectProductsState(appState),
});

const actions = {
  doFetchProducts: fetchProducts,
};

const ProductItem = ({ item }: { item: ProductType }) => (
  <Link
    to={`/products/${item.id}`}
    className="slds-text-link_reset slds-p-around_medium"
  >
    <Card
      heading={item.title}
      icon={<Avatar variant="entity" label={item.title} />}
    >
      <div className="slds-card__body_inner">
        <div className="slds-text-title">Version {item.version}</div>
        <p className="slds-truncate">{item.description}</p>
      </div>
    </Card>
  </Link>
);

class ProductsList extends React.Component<{
  products: ProductsType,
  doFetchProducts: typeof fetchProducts,
}> {
  componentDidMount() {
    this.props.doFetchProducts();
  }

  render(): React.Node {
    const productItems = this.props.products.map(item => (
      <ProductItem item={item} key={item.id} />
    ));
    return (
      <DocumentTitle title="Products | MetaDeploy">
        <div>{productItems}</div>
      </DocumentTitle>
    );
  }
}

export default connect(
  select,
  actions,
)(ProductsList);
