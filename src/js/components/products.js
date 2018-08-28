// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import DocumentTitle from 'react-document-title';
import Icon from '@salesforce/design-system-react/components/icon';
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

class ProductItem extends React.Component<{
  item: ProductType,
}> {
  getIcon(): React.Node {
    const { item } = this.props;
    if (item.icon && item.icon.type === 'url' && item.icon.url) {
      // Custom icon at provided URL
      return (
        <Avatar
          variant="entity"
          label={item.title}
          imgSrc={item.icon.url}
          imgAlt={item.title}
          title={item.title}
        />
      );
    }
    if (
      item.icon &&
      item.icon.type === 'slds' &&
      item.icon.category &&
      item.icon.name
    ) {
      // Custom SLDS svg icon
      return (
        <span className="slds-avatar slds-avatar_medium">
          <Icon
            assistiveText={{ label: item.title }}
            category={item.icon.category}
            name={item.icon.name}
          />
        </span>
      );
    }
    if (item.color) {
      // Standard entity icon (initials) with custom color
      return (
        <div
          className="has-custom-color"
          style={{ '--custom-color': item.color }}
        >
          <Avatar variant="entity" label={item.title} />
        </div>
      );
    }
    // Standard entity icon (initials)
    return <Avatar variant="entity" label={item.title} />;
  }

  render(): React.Node {
    const { item } = this.props;
    const icon = this.getIcon();
    return (
      <Link
        to={routes.product_detail(item.id)}
        className="slds-text-link_reset slds-p-around_medium"
      >
        <Card heading={item.title} icon={icon}>
          <div className="slds-card__body_inner">
            <div className="slds-text-title">Version {item.version}</div>
            <p className="slds-truncate">{item.description}</p>
          </div>
        </Card>
      </Link>
    );
  }
}

class ProductsList extends React.Component<{
  productsByCategory: ProductsMapType,
  doFetchProducts: typeof fetchProducts,
}> {
  componentDidMount() {
    // Instead of doing this every time, we could:
    //   - Only do it once on initial app-load
    //   - Only do it when the cached values are old
    this.props.doFetchProducts();
  }

  static getProductComponents(products: ProductsType): React.Node {
    return products.map(item => <ProductItem item={item} key={item.id} />);
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
        contents = <div>{ProductsList.getProductComponents(products)}</div>;
        break;
      }
      default: {
        // Products are in multiple categories; divide into tabs
        const tabs = [];
        for (const [category, products] of this.props.productsByCategory) {
          const panel = (
            <TabsPanel label={category} key={category}>
              {ProductsList.getProductComponents(products)}
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
