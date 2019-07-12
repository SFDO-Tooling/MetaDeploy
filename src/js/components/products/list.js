// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Spinner from '@salesforce/design-system-react/components/spinner';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import i18n from 'i18next';
import { connect } from 'react-redux';
import { withScroll } from 'react-fns';

import { fetchMoreProducts } from 'store/products/actions';
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
import type { Category, Product } from 'store/products/reducer';

type Props = {
  ...InitialProps,
  x: number,
  y: number,
  productsByCategory: ProductsMapType,
  productCategories: Array<Category>,
  doFetchMoreProducts: ({ url: string, id: number }) => Promise<any>,
};
type State = {
  activeProductsTab: string | null,
  fetchingProducts: boolean,
};

class ProductsList extends React.Component<Props, State> {
  // This is often considered an anti-pattern in React, but it's acceptable in
  // cases where we don't want to cancel or cleanup an asynchronous action on
  // unmount -- we just want to prevent a post-unmount state update after the
  // action finishes.
  // https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
  _isMounted: boolean;

  constructor(props) {
    super(props);
    let activeProductsTab = null;
    let hashTab: Category | void;
    try {
      if (window.location.hash) {
        hashTab = props.productCategories.find(
          category =>
            window.location.hash.substring(1) === prettyUrlHash(category.title),
        );
      }
      if (hashTab) {
        activeProductsTab = hashTab.title;
      } else {
        activeProductsTab = window.sessionStorage.getItem('activeProductsTab');
      }
    } catch (e) {
      // swallow error
    }
    this.state = {
      activeProductsTab,
      fetchingProducts: false,
    };
  }

  static getProductsList(products: Array<Product>): React.Node {
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

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnMount() {
    this._isMounted = false;
  }

  handleSelect = (index: number) => {
    const { history, productCategories } = this.props;
    try {
      const category = productCategories[index];
      /* istanbul ignore else */
      if (category) {
        window.sessionStorage.setItem('activeProductsTab', category.title);
        this.setState({ activeProductsTab: category.title });
        history.replace({ hash: prettyUrlHash(category.title) });
      } else {
        window.sessionStorage.removeItem('activeProductsTab');
        this.setState({ activeProductsTab: null });
        history.replace({ hash: '' });
      }
    } catch (e) {
      // swallow error
    }
  };

  maybeFetchMoreProducts = () => {
    const { activeProductsTab, fetchingProducts } = this.state;
    const { productCategories, doFetchMoreProducts } = this.props;
    const activeCategory = activeProductsTab
      ? productCategories.find(category => category.title === activeProductsTab)
      : productCategories[0];
    const moreProductsUrl = activeCategory && activeCategory.next;

    if (activeCategory && moreProductsUrl && !fetchingProducts) {
      this.setState({ fetchingProducts: true });
      doFetchMoreProducts({
        url: moreProductsUrl,
        id: activeCategory.id,
      }).finally(() => {
        if (this._isMounted) {
          this.setState({ fetchingProducts: false });
        }
      });
    }
  };

  componentDidUpdate(prevProps) {
    const { y } = this.props;
    const { fetchingProducts } = this.state;
    if (y === prevProps.y || fetchingProducts) {
      return;
    }
    /* istanbul ignore next */
    const scrollHeight =
      (document.documentElement && document.documentElement.scrollHeight) ||
      (document.body && document.body.scrollHeight) ||
      Infinity;
    const clientHeight =
      (document.documentElement && document.documentElement.clientHeight) ||
      window.innerHeight;
    // Fetch more products if within 100px of bottom of page...
    const scrolledToBottom = scrollHeight - Math.ceil(y + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      this.maybeFetchMoreProducts();
    }
  }

  render(): React.Node {
    const { activeProductsTab, fetchingProducts } = this.state;
    const { productsByCategory, productCategories } = this.props;
    let contents;
    switch (productsByCategory.size) {
      case 0: {
        // No products; show empty message
        const msg = i18n.t('We couldn’t find any products. Try again later?');
        contents = <EmptyIllustration message={msg} />;
        break;
      }
      case 1: {
        // Products are all in one category; no need for multicategory tabs
        const products = Array.from(productsByCategory.values())[0];
        contents = ProductsList.getProductsList(products);
        break;
      }
      default: {
        // Products are in multiple categories; divide into tabs
        const tabs = [];
        for (const [category, products] of productsByCategory) {
          const panel = (
            <TabsPanel label={category} key={category}>
              {ProductsList.getProductsList(products)}
            </TabsPanel>
          );
          tabs.push(panel);
        }
        const savedTabIndex = productCategories.findIndex(
          category => category.title === activeProductsTab,
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
            {fetchingProducts ? (
              <div className="slds-align_absolute-center slds-m-top_x-large">
                <span className="slds-is-relative slds-m-right_large">
                  <Spinner variant="brand" size="small" />
                </span>
                {i18n.t('Loading…')}
              </div>
            ) : null}
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

const actions = {
  doFetchMoreProducts: fetchMoreProducts,
};

const WrappedProductsList: React.ComponentType<InitialProps> = connect(
  select,
  actions,
)(withScroll(ProductsList));

export default WrappedProductsList;
