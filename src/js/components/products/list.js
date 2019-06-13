// @flow
// @TODO FIX SPINNER STYLES
// SET COUNT ON STATE TO KNOW IF NEXT NEEDED
// GET CATEGORY ID FROM PROPS
import * as React from 'react';
import Spinner from '@salesforce/design-system-react/components/spinner';
import DocumentTitle from 'react-document-title';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import i18n from 'i18next';
import { connect } from 'react-redux';
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
import type { Product } from 'store/products/reducer';

type Props = {
  ...InitialProps,
  productsByCategory: ProductsMapType,
  productCategories: Array<string>,
  doFetchMoreProducts: typeof fetchMoreProducts,
};
type State = {
  activeProductsTab: string | null,
  fetchingProducts: boolean,
  categoryId: number,
  count: number,
  hasMoreProducts: boolean,
};

class ProductsList extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    let activeProductsTab = null;
    let hashTab;
    try {
      // @todo this needs some cleanup
      if (window.location.hash) {
        hashTab = Object.values(props.productCategories).find(
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
    this.state = {
      activeProductsTab,
      fetchingProducts: false,
      categoryId: null,
      count: 2,
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

  handleSelect = (index: number) => {
    const { history } = this.props;
    try {
      const category = this.props.productCategories[index];

      /* istanbul ignore else */
      if (category) {
        window.sessionStorage.setItem(
          'activeProductsTab',
          Object.values(category),
        );
        this.setState({ categoryId: Object.keys(category)[0] });
        history.replace({ hash: prettyUrlHash(Object.values(category)[0]) });
      } else {
        window.sessionStorage.removeItem('activeProductsTab');
        history.replace({ hash: '' });
      }
    } catch (e) {
      // swallor error
    }
  };

  handleOnScroll = () => {
    const { fetchingProducts } = this.state;
    const scrollTop =
      (document.documentElement && document.documentElement.scrollTop) ||
      (document.body && document.body.scrollTop) ||
      0;
    const scrollHeight =
      (document.documentElement && document.documentElement.scrollHeight) ||
      (document.body && document.body.scrollHeight) ||
      Infinity;
    const clientHeight =
      (document.documentElement && document.documentElement.clientHeight) ||
      window.innerHeight;
    const scrolledToBottom =
      Math.ceil(scrollTop + clientHeight) >= scrollHeight;

    if (fetchingProducts) {
      return;
    }
    if (scrolledToBottom) {
      this.setState({ fetchingProducts: true });
      this.shouldFetchMoreProducts();
    }
  };

  shouldFetchMoreProducts = () => {
    const { doFetchMoreProducts, activeProductsTab } = this.props;
    const { categoryId, count, fetchingProducts } = this.state;
    // @TODO GET 'NEXT` FROM PRODUCT LIST, OR CATCH 404 ERROR AT END OF LIST //
    doFetchMoreProducts(categoryId, count).then(() => {
      this.setState({ fetchingProducts: false, count: this.state.count + 1 });
    });
  };

  componentDidMount() {
    document.addEventListener('scroll', this.handleOnScroll);
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleOnScroll);
  }

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
        const savedTabIndex = this.props.productCategories[
          this.state.activeProductsTab
        ];
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
    const { fetchingProducts } = this.state;
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
            {fetchingProducts && (
              <div
                className="slds-align_absolute-center"
                style={{ height: '10rem', position: 'relative' }}
              >
                <Spinner
                  size="small"
                  variant="base"
                  assistiveText={{ label: 'Loading' }}
                />
                <span>{i18n.t('Loading…')}</span>
              </div>
            )}
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
)(ProductsList);

export default WrappedProductsList;
