// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { fetchProducts } from 'products/actions';

import type {
  Products as ProductsType,
  Product as ProductType,
} from 'products/reducer';

type ProductsMapType = Map<string, Array<ProductType>>;

const selectProductsState = (appState): ProductsType => appState.products;

const selectProductsByCategory = createSelector(
  selectProductsState,
  (products: ProductsType): ProductsMapType => {
    const productsByCategory = new Map();
    for (const product of products) {
      const category = product.category;
      const existing = productsByCategory.get(category) || [];
      existing.push(product);
      productsByCategory.set(category, existing);
    }
    return productsByCategory;
  },
);

const select = appState => ({
  productsByCategory: selectProductsByCategory(appState),
});

const actions = {
  doFetchProducts: fetchProducts,
};

const ProductItem = ({ item }: { item: ProductType }) => (
  <Link
    to={routes.product_detail(item.id)}
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
  productsByCategory: ProductsMapType,
  doFetchProducts: typeof fetchProducts,
}> {
  componentDidMount() {
    // @@@ Do we need to do this every time?
    this.props.doFetchProducts();
  }

  static mapProducts(products: ProductsType): React.Node {
    return products.map(item => <ProductItem item={item} key={item.id} />);
  }

  render(): React.Node {
    let contents;
    switch (this.props.productsByCategory.size) {
      case 0: {
        contents = (
          <div className="slds-text-longform">
            <h1 className="slds-text-heading_large">Uh oh.</h1>
            <p>We couldn&rsquo;t find any products.</p>
          </div>
        );
        break;
      }
      case 1: {
        const products = Array.from(this.props.productsByCategory.values())[0];
        contents = <div>{ProductsList.mapProducts(products)}</div>;
        break;
      }
      default: {
        const tabs = [];
        for (const [category, products] of this.props.productsByCategory) {
          const panel = (
            <TabsPanel label={category} key={category}>
              {ProductsList.mapProducts(products)}
            </TabsPanel>
          );
          tabs.push(panel);
        }
        contents = <Tabs variant="scoped">{tabs}</Tabs>;
        break;
      }
    }
    return (
      <DocumentTitle title="Products | MetaDeploy">{contents}</DocumentTitle>
    );
  }
}

export default connect(
  select,
  actions,
)(ProductsList);
