// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { saveActiveTab } from 'settings/actions';

import ProductItem from 'components/products/listItem';

import type {
  Products as ProductsType,
  Product as ProductType,
} from 'products/reducer';
import type {
  Settings as SettingsType,
  ActiveProductsTab as ActiveProductsTabType,
} from 'settings/reducer';

type ProductsMapType = Map<string, Array<ProductType>>;

class ProductsList extends React.Component<
  {
    productsByCategory: ProductsMapType,
    productCategories: Array<string>,
    activeProductsTab: ActiveProductsTabType,
    doSaveActiveTab: typeof saveActiveTab,
  },
  { activeProductsTab: ActiveProductsTabType },
> {
  constructor(props) {
    super(props);
    this.state = { activeProductsTab: props.activeProductsTab };
  }

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

  handleSelect = (index: number) => {
    /* istanbul ignore next */
    const category = this.props.productCategories[index] || null;
    if (category !== this.props.activeProductsTab) {
      this.props.doSaveActiveTab(category);
    }
  };

  render(): React.Node {
    let contents;
    switch (this.props.productsByCategory.size) {
      case 0: {
        // No products; show empty message
        contents = (
          <div className="slds-text-longform">
            <h1 className="slds-text-heading_large">¯\_(ツ)_/¯</h1>
            <p>We couldn’t find any products.</p>
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
        const savedTabIndex = this.props.productCategories.indexOf(
          this.state.activeProductsTab,
        );
        contents = (
          <Tabs
            variant="scoped"
            onSelect={this.handleSelect}
            defaultSelectedIndex={savedTabIndex === -1 ? 0 : savedTabIndex}
          >
            {tabs}
          </Tabs>
        );
        break;
      }
    }
    return (
      <DocumentTitle title="Products | MetaDeploy">
        <div className="slds-p-around_x-large">{contents}</div>
      </DocumentTitle>
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

const selectProductCategories = createSelector(
  selectProductsByCategory,
  (productsByCategory: ProductsMapType): Array<string> => [
    ...productsByCategory.keys(),
  ],
);

const selectSettingsState = (appState): SettingsType => appState.settings;

const selectActiveProductsTab = createSelector(
  selectSettingsState,
  (settings: SettingsType): ActiveProductsTabType => settings.activeProductsTab,
);

const select = appState => ({
  productsByCategory: selectProductsByCategory(appState),
  productCategories: selectProductCategories(appState),
  activeProductsTab: selectActiveProductsTab(appState),
});

const actions = {
  doSaveActiveTab: saveActiveTab,
};

export default connect(
  select,
  actions,
)(ProductsList);
