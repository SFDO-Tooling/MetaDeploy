import Spinner from '@salesforce/design-system-react/components/spinner';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { t } from 'i18next';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { withScroll } from 'react-fns';
import { connect, ConnectedProps } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { EmptyIllustration } from '@/js/components/404';
import Header from '@/js/components/header';
import PageHeader from '@/js/components/products/listHeader';
import ProductItem from '@/js/components/products/listItem';
import { AppState } from '@/js/store';
import { fetchMoreProducts } from '@/js/store/products/actions';
import { Category, Product } from '@/js/store/products/reducer';
import { selectVisibleCategoriesWithProducts } from '@/js/store/products/selectors';
import { prettyUrlHash } from '@/js/utils/helpers';

const select = (appState: AppState) => ({
  productCategories: selectVisibleCategoriesWithProducts(appState),
});

const actions = {
  doFetchMoreProducts: fetchMoreProducts,
};

const connector = connect(select, actions);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = {
  x: number;
  y: number;
} & PropsFromRedux &
  RouteComponentProps;
type State = {
  activeProductsTab: string | null;
  fetchingProducts: boolean;
};

class ProductsList extends React.Component<Props, State> {
  // unmount -- we just want to prevent a post-unmount state update after the
  // action finishes.
  // https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
  _isMounted!: boolean;

  constructor(props: Props) {
    super(props);
    let activeProductsTab = null;
    let hashTab: Category | void;
    try {
      if (window.location.hash) {
        hashTab = props.productCategories.find(
          ({ category }) =>
            window.location.hash.substring(1) === prettyUrlHash(category.title),
        )?.category;
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

  static getProductsList(products: Product[], category?: Category) {
    return (
      <>
        {category?.description && (
          <div
            className="slds-text-longform
              slds-p-around_small
              slds-size_1-of-1
              slds-large-size_2-of-3
              markdown"
            dangerouslySetInnerHTML={{
              __html: category.description,
            }}
          />
        )}
        <div className="slds-size_1-of-1 slds-grid slds-wrap">
          {products.map((item) => (
            <ProductItem item={item} key={item.id} />
          ))}
        </div>
      </>
    );
  }

  componentDidMount() {
    this._isMounted = true;
  }

  /* istanbul ignore next */
  componentWillUnMount() {
    this._isMounted = false;
  }

  handleSelect = (index: number) => {
    const { history, productCategories } = this.props;
    try {
      const { category } = productCategories[index];

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
      ? productCategories.find(
          ({ category }) => category.title === activeProductsTab,
        )?.category
      : productCategories[0]?.category;
    const moreProductsUrl = activeCategory?.next;

    if (activeCategory && moreProductsUrl && !fetchingProducts) {
      this.setState({ fetchingProducts: true });
      doFetchMoreProducts({
        url: moreProductsUrl,
        id: activeCategory.id,
      }).finally(() => {
        /* istanbul ignore else */
        if (this._isMounted) {
          this.setState({ fetchingProducts: false });
        }
      });
    }
  };

  componentDidUpdate(prevProps: Props) {
    const { y } = this.props;
    const { fetchingProducts } = this.state;
    if (y === prevProps.y || fetchingProducts) {
      return;
    }

    /* istanbul ignore next */
    const scrollHeight =
      document.documentElement?.scrollHeight ||
      document.body?.scrollHeight ||
      Infinity;
    const clientHeight =
      document.documentElement?.clientHeight || window.innerHeight;
    // Fetch more products if within 100px of bottom of page...
    const scrolledToBottom = scrollHeight - Math.ceil(y + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      this.maybeFetchMoreProducts();
    }
  }

  render() {
    const { activeProductsTab, fetchingProducts } = this.state;
    const { productCategories } = this.props;
    let contents;
    switch (productCategories.length) {
      case 0: {
        // No products; show empty message
        const msg = t('We couldn’t find any products. Try again later?');
        contents = <EmptyIllustration message={msg} />;
        break;
      }
      case 1: {
        // Products are all in one category; no need for category tabs
        const { category, products } = productCategories[0];
        contents = ProductsList.getProductsList(products, category);
        break;
      }
      default: {
        // Products are in multiple categories; divide into tabs
        const tabs = [];
        for (const { category, products } of productCategories) {
          const panel = (
            <TabsPanel label={category.title} key={category.id}>
              {ProductsList.getProductsList(products, category)}
            </TabsPanel>
          );
          tabs.push(panel);
        }
        const savedTabIndex = productCategories.findIndex(
          ({ category }) => category.title === activeProductsTab,
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
      <DocumentTitle title={`${t('Products')} | ${window.SITE_NAME}`}>
        <>
          <Header history={this.props.history} />
          <PageHeader />
          <div className="slds-p-around_x-large">
            {window.GLOBALS.SITE?.welcome_text ? (
              // These messages are pre-cleaned by the API
              <div
                className="markdown
                  slds-p-bottom_medium
                  slds-text-longform
                  slds-size_1-of-1
                  slds-large-size_2-of-3"
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
                {t('Loading…')}
              </div>
            ) : null}
          </div>
        </>
      </DocumentTitle>
    );
  }
}

const WrappedProductsList = connector(withScroll(withRouter(ProductsList)));

export default WrappedProductsList;
