// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import i18n from 'i18next';
import { connect } from 'react-redux';

import { prettyUrlHash } from 'utils/helpers';
import {
  selectProductCategories,
  selectProductsByCategory,
} from 'store/products/selectors';
import Header from 'components/header';
import PageHeader from 'components/products/listHeader';
import ProductItem from 'components/products/listItem';
import { EmptyIllustration } from 'components/404';
import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type { ProductsMapType } from 'store/products/selectors';
import type { Products as ProductsType } from 'store/products/reducer';

type Props = {
  ...InitialProps,
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
    let hashTab;
    try {
      if (window.location.hash) {
        hashTab = props.productCategories.find(
          category =>
            window.location.hash.substring(1) === prettyUrlHash(category),
        );
      }
      if (hashTab) {
        activeProductsTab = hashTab;
      } else {
        activeProductsTab = window.sessionStorage.getItem('activeProductsTab');
      }
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
    const { history } = this.props;
    try {
      const category = this.props.productCategories[index];
      /* istanbul ignore else */
      if (category) {
        window.sessionStorage.setItem('activeProductsTab', category);
        history.replace({ hash: prettyUrlHash(category) });
      } else {
        window.sessionStorage.removeItem('activeProductsTab');
        history.replace({ hash: '' });
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
        const msg = i18n.t('We couldn’t find any products. Try again later?');
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
      <DocumentTitle title={`${i18n.t('Products')} | ${window.SITE_NAME}`}>
        <>
          <Header history={this.props.history} />
          <PageHeader />
          <div className="slds-p-around_x-large">
            {window.GLOBALS.SITE && window.GLOBALS.SITE.welcome_text ? (
              // These messages are pre-cleaned by the API
              <div
                className="markdown
                  slds-p-bottom_medium
                  slds-text-longform
                  slds-size_1-of-1
                  slds-medium-size_1-of-2"
                dangerouslySetInnerHTML={{
                  __html: window.GLOBALS.SITE.welcome_text,
                }}
              />
            ) : null}
            {contents}
          </div>
        </>
      </DocumentTitle>
    );
  }
}

const select = (appState: AppState) => ({
  productCategories: selectProductCategories(appState),
  productsByCategory: selectProductsByCategory(appState),
});

const WrappedProductsList: React.ComponentType<InitialProps> = connect(select)(
  ProductsList,
);

export default WrappedProductsList;
