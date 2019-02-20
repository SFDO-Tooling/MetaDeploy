// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { connect } from 'react-redux';
import { t } from 'i18next';

import {
  selectProductCategories,
  selectProductsByCategory,
} from 'store/products/selectors';
import ProductItem from 'components/products/listItem';
import { EmptyIllustration } from 'components/404';
import type { AppState } from 'store';
import type { ProductsMapType } from 'store/products/selectors';
import type { Products as ProductsType } from 'store/products/reducer';

type Props = {
  productsByCategory: ProductsMapType,
  productCategories: Array<string>,
};
type State = {
  activeProductsTab: string | null,
};

class ProductsList extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    let activeProductsTab = null;
    try {
      activeProductsTab = window.sessionStorage.getItem('activeProductsTab');
    } catch (e) {
      // swallow error
    }
    this.state = { activeProductsTab };
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
    try {
      const category = this.props.productCategories[index];
      /* istanbul ignore else */
      if (category) {
        window.sessionStorage.setItem('activeProductsTab', category);
      } else {
        window.sessionStorage.removeItem('activeProductsTab');
      }
    } catch (e) {
      // swallor error
    }
  };

  render(): React.Node {
    let contents;
    switch (this.props.productsByCategory.size) {
      case 0: {
        // No products; show empty message
        const msg = t('We couldn’t find any products. Try again later?');
        contents = <EmptyIllustration message={msg} />;
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
      <DocumentTitle title={`${t('Products')} | ${t('MetaDeploy')}`}>
        <div className="slds-p-around_x-large">{contents}</div>
      </DocumentTitle>
    );
  }
}

const select = (appState: AppState): Props => ({
  productCategories: selectProductCategories(appState),
  productsByCategory: selectProductsByCategory(appState),
});

const WrappedProductsList: React.ComponentType<{}> = connect(select)(
  ProductsList,
);

export default WrappedProductsList;
