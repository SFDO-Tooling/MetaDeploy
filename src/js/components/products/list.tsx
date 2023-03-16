import useScrollPosition from '@react-hook/window-scroll';
import Spinner from '@salesforce/design-system-react/components/spinner';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { EmptyIllustration } from '@/js/components/404';
import Header from '@/js/components/header';
import PageHeader from '@/js/components/products/listHeader';
import ProductItem from '@/js/components/products/listItem';
import { useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { fetchMoreProducts } from '@/js/store/products/actions';
import { Category, Product } from '@/js/store/products/reducer';
import { selectVisibleCategoriesWithProducts } from '@/js/store/products/selectors';
import { prettyUrlHash } from '@/js/utils/helpers';

const getProductsList = (products: Product[], category?: Category) => (
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

const ProductsList = () => {
  const { t } = useTranslation();
  const scrollY = useScrollPosition();
  const dispatch = useDispatch<ThunkDispatch>();
  const history = useHistory();
  const isMounted = useIsMounted();
  const productCategories = useSelector(selectVisibleCategoriesWithProducts);
  const [activeProductsTab, setActiveProductsTab] = useState<string | null>(
    null,
  );
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const prevScrollY = useRef(scrollY);

  // Restore last-used category tab selection (or directly from URL)
  useEffect(() => {
    let hashTab: Category | void;
    try {
      if (window.location.hash) {
        hashTab = productCategories.find(
          ({ category }) =>
            window.location.hash.substring(1) === prettyUrlHash(category.title),
        )?.category;
      }
      if (hashTab) {
        setActiveProductsTab(hashTab.title);
      } else {
        setActiveProductsTab(
          window.sessionStorage.getItem('activeProductsTab'),
        );
      }
    } catch (e) {
      // swallow error
    }
    // We only want this to run once initially, with initial categories
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch more products (if there are more) after scrolling to bottom of list
  useEffect(() => {
    const scrollChanged = scrollY !== prevScrollY.current;
    prevScrollY.current = scrollY;

    if (fetchingProducts || !scrollChanged) {
      return;
    }

    const maybeFetchMoreProducts = () => {
      const activeCategory = activeProductsTab
        ? productCategories.find(
            ({ category }) => category.title === activeProductsTab,
          )?.category
        : productCategories[0]?.category;
      const moreProductsUrl = activeCategory?.next;

      if (activeCategory && moreProductsUrl && !fetchingProducts) {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingProducts(true);
        }
        dispatch(
          fetchMoreProducts({
            url: moreProductsUrl,
            id: activeCategory.id,
          }),
        ).finally(() => {
          /* istanbul ignore else */
          if (isMounted.current) {
            setFetchingProducts(false);
          }
        });
      }
    };

    /* istanbul ignore next */
    const scrollHeight =
      document.documentElement?.scrollHeight ||
      document.body?.scrollHeight ||
      Infinity;
    const clientHeight =
      document.documentElement?.clientHeight || window.innerHeight;
    // Fetch more products if within 100px of bottom of page...
    const scrolledToBottom =
      scrollHeight - Math.ceil(scrollY + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      maybeFetchMoreProducts();
    }
  }, [
    activeProductsTab,
    dispatch,
    fetchingProducts,
    isMounted,
    productCategories,
    scrollY,
  ]);

  const handleSelect = useCallback(
    (index: number) => {
      try {
        const { category } = productCategories[index];

        /* istanbul ignore else */
        if (category) {
          window.sessionStorage.setItem('activeProductsTab', category.title);
          setActiveProductsTab(category.title);
          history.replace({ hash: prettyUrlHash(category.title) });
        } else {
          window.sessionStorage.removeItem('activeProductsTab');
          setActiveProductsTab(null);
          history.replace({ hash: '' });
        }
      } catch (e) {
        // swallow error
      }
    },
    [history, productCategories],
  );

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
      contents = getProductsList(products, category);
      break;
    }
    default: {
      // Products are in multiple categories; divide into tabs
      const tabs = [];
      for (const { category, products } of productCategories) {
        const panel = (
          <TabsPanel label={category.title} key={category.id}>
            {getProductsList(products, category)}
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
          onSelect={handleSelect}
          selectedIndex={savedTabIndex === -1 ? undefined : savedTabIndex}
        >
          {tabs}
        </Tabs>
      );
      break;
    }
  }

  return (
    <>
      <Helmet>
        <title>{`${t('Products')} | ${window.SITE_NAME}`}</title>
      </Helmet>
      <Header history={history} />
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
  );
};

export default ProductsList;
