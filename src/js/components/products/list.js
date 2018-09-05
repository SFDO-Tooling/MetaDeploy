// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import ProductItem from 'components/products/listItem';

import type {
  Products as ProductsType,
  Product as ProductType,
} from 'products/reducer';

type ProductsMapType = Map<string, Array<ProductType>>;

class ProductsList extends React.Component<{
  productsByCategory: ProductsMapType,
}> {
  static getProductsList(products: ProductsType): React.Node {
    return (
      <div
        className="slds-grid
          slds-wrap"
      >
        {products.map(item => (
          <ProductItem item={item} key={item.id} />
        ))}
      </div>
    );
  }

  render(): React.Node {
    let contents;
    switch (this.props.productsByCategory.size) {
      case 0: {
        // No products; show empty message
        contents = (
          <div className="slds-text-longform">
            <h1 className="slds-text-heading_large">Uh oh.</h1>
            <p>We couldn&rsquo;t find any products.</p>
          </div>
        );
        break;
      }
      case 1: {
        // Products are all in one category; no need for multicategory tabs
        const products = Array.from(this.props.productsByCategory.values())[0];
        contents = ProductsList.getProductsList(products);
        break;
      }
      default: {
        // Products are in multiple categories; divide into tabs
        const tabs = [];
        for (const [category, products] of this.props.productsByCategory) {
          const panel = (
            <TabsPanel label={category} key={category}>
              {ProductsList.getProductsList(products)}
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

export default connect(select)(ProductsList);
