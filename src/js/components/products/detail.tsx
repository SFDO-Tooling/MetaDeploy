import i18n from 'i18next';
import { sortBy } from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { connect, ConnectedProps } from 'react-redux';
import {
  Link,
  Redirect,
  RouteComponentProps,
  withRouter,
} from 'react-router-dom';

import BackLink from '@/js/components/backLink';
import BodyContainer from '@/js/components/bodyContainer';
import Header from '@/js/components/header';
import PageHeader from '@/js/components/products/header';
import ProductNotAllowed from '@/js/components/products/notAllowed';
import OldVersionWarning from '@/js/components/products/oldVersionWarning';
import PlanCards from '@/js/components/products/planCards';
import ProductNotFound from '@/js/components/products/product404';
import VersionNotFound from '@/js/components/products/version404';
import {
  getLoadingOrNotFound,
  shouldFetchVersion,
} from '@/js/components/utils';
import { AppState } from '@/js/store';
import { Plan } from '@/js/store/plans/reducer';
import {
  fetchAdditionalPlans,
  fetchPlan,
  fetchProduct,
  fetchVersion,
} from '@/js/store/products/actions';
import { Product } from '@/js/store/products/reducer';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabelOrPlanSlug,
} from '@/js/store/products/selectors';
import { selectUserState } from '@/js/store/user/selectors';
import { PRODUCT_LAYOUTS } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

const selectProductDetail = (
  appState: AppState,
  props: RouteComponentProps,
) => ({
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
});

const selectVersionDetail = (
  appState: AppState,
  props: RouteComponentProps,
) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabelAndPlanSlug: selectVersionLabelOrPlanSlug(appState, props),
});

const productActions = {
  doFetchProduct: fetchProduct,
};

const versionActions = {
  doFetchProduct: fetchProduct,
  doFetchVersion: fetchVersion,
  doFetchAdditionalPlans: fetchAdditionalPlans,
  doFetchPlan: fetchPlan,
};

const productConnector = connect(selectProductDetail, productActions);
const versionConnector = connect(selectVersionDetail, versionActions);

type ProductPropsFromRedux = ConnectedProps<typeof productConnector>;
type VersionPropsFromRedux = ConnectedProps<typeof versionConnector>;

type ProductDetailProps = ProductPropsFromRedux;
type VersionDetailProps = VersionPropsFromRedux & RouteComponentProps;

class ProductDetail extends React.Component<ProductDetailProps> {
  fetchProductIfMissing() {
    const { product, productSlug, doFetchProduct } = this.props;
    if (product === undefined && productSlug) {
      // Fetch product from API
      doFetchProduct({ slug: productSlug });
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
  }

  componentDidUpdate(prevProps: ProductDetailProps) {
    const { product, productSlug } = this.props;
    const productChanged =
      product !== prevProps.product || productSlug !== prevProps.productSlug;
    if (productChanged) {
      this.fetchProductIfMissing();
    }
  }

  render() {
    const { product, productSlug } = this.props;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      productSlug,
      route: 'product_detail',
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // This redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations

    /* istanbul ignore if */
    if (!product) {
      return <ProductNotFound />;
    }
    if (!product.most_recent_version) {
      return <VersionNotFound product={product} />;
    }
    const version = product.most_recent_version;
    return <Redirect to={routes.version_detail(product.slug, version.label)} />;
  }
}

const BodySection = ({ children }: { children?: React.ReactNode }) => (
  <div
    className="slds-text-longform
      slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
  >
    {children}
  </div>
);

class VersionDetail extends React.Component<VersionDetailProps> {
  fetchProductIfMissing() {
    const { product, productSlug, doFetchProduct } = this.props;
    if (product === undefined && productSlug) {
      // Fetch product from API
      doFetchProduct({ slug: productSlug });
    }
  }

  fetchVersionIfMissing() {
    const { product, version, versionLabelAndPlanSlug, doFetchVersion } =
      this.props;
    const { label, slug } = versionLabelAndPlanSlug;
    // If we have a plan slug, do not try to fetch version
    // (redirect to plan-detail instead)
    if (
      product &&
      label &&
      !slug &&
      shouldFetchVersion({ product, version, versionLabel: label })
    ) {
      // Fetch version from API
      doFetchVersion({ product: product.id, label });
    }
  }

  fetchAdditionalPlansIfMissing() {
    const { product, version, doFetchAdditionalPlans } = this.props;
    if (product && version && !version.fetched_additional_plans) {
      // Fetch plans from API
      doFetchAdditionalPlans({ product: product.id, version: version.id });
    }
  }

  fetchPlanIfMissing() {
    const { product, versionLabelAndPlanSlug, doFetchPlan } = this.props;
    const { maybeVersion, maybeSlug } = versionLabelAndPlanSlug;
    if (product && maybeVersion && maybeSlug) {
      // Fetch plan from API
      doFetchPlan({
        product: product.id,
        version: maybeVersion,
        slug: maybeSlug,
      });
    }
  }

  componentDidMount() {
    this.fetchProductIfMissing();
    this.fetchVersionIfMissing();
    this.fetchAdditionalPlansIfMissing();
    this.fetchPlanIfMissing();
  }

  componentDidUpdate(prevProps: VersionDetailProps) {
    const { product, productSlug, version, versionLabelAndPlanSlug } =
      this.props;
    const { label, slug, maybeVersion, maybeSlug } = versionLabelAndPlanSlug;
    const productChanged =
      product !== prevProps.product || productSlug !== prevProps.productSlug;
    const versionChanged =
      productChanged ||
      version !== prevProps.version ||
      label !== prevProps.versionLabelAndPlanSlug.label ||
      slug !== prevProps.versionLabelAndPlanSlug.slug ||
      maybeVersion !== prevProps.versionLabelAndPlanSlug.maybeVersion ||
      maybeSlug !== prevProps.versionLabelAndPlanSlug.maybeSlug;
    if (productChanged) {
      this.fetchProductIfMissing();
    }
    if (versionChanged) {
      this.fetchVersionIfMissing();
      this.fetchAdditionalPlansIfMissing();
      this.fetchPlanIfMissing();
    }
  }

  static getProductDescription(product: Product) {
    const isCardLayout = product.layout === PRODUCT_LAYOUTS.Card;
    const productDescriptionHasTitle =
      product.description?.startsWith('<h1>') ||
      product.description?.startsWith('<h2>');

    return (
      <>
        {!productDescriptionHasTitle && !isCardLayout && (
          <h2 className="slds-text-heading_small">
            {i18n.t('About {{title}}', { title: product.title })}
          </h2>
        )}
        {product.image ? (
          <img
            className="slds-size_full"
            src={product.image}
            alt={product.title}
          />
        ) : null}
        {/* This description is pre-cleaned by the API */}
        {product.description && (
          <div
            className="markdown"
            dangerouslySetInnerHTML={{
              __html: product.description,
            }}
          />
        )}
      </>
    );
  }

  render() {
    const {
      user,
      product,
      productSlug,
      version,
      versionLabelAndPlanSlug,
      history,
    } = this.props;
    const { label, slug, maybeVersion, maybeSlug } = versionLabelAndPlanSlug;
    const loadingOrNotFound = getLoadingOrNotFound({
      product,
      productSlug,
      version,
      versionLabel: label,
      planSlug: slug,
      route: 'version_detail',
      maybeVersion,
      maybeSlug,
    });
    if (loadingOrNotFound !== false) {
      return loadingOrNotFound;
    }
    // this redundant check is required to satisfy Flow:
    // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations

    /* istanbul ignore if */
    if (!product || !version) {
      return <ProductNotFound />;
    }

    const listedAdditionalPlans: Plan[] = version.additional_plans
      ? (Object.entries(version.additional_plans) as any)
          .filter(
            ([key, plan]: [string, Plan | null]) =>
              plan?.is_listed && plan?.is_allowed && key === plan?.slug,
          )
          .map((item: [string, Plan][]) => item[1])
      : [];
    const additionalPlansSorted = sortBy(listedAdditionalPlans, ['order_key']);
    const { primary_plan, secondary_plan } = version;
    const visiblePrimaryPlan =
      primary_plan?.is_listed && primary_plan?.is_allowed;
    const visibleSecondaryPlan =
      secondary_plan?.is_listed && secondary_plan?.is_allowed;
    const isMostRecent =
      product.most_recent_version &&
      new Date(version.created_at) >=
        new Date(product.most_recent_version.created_at);
    const isCardLayout = product.layout === PRODUCT_LAYOUTS.Card;

    return (
      <DocumentTitle title={`${product.title} | ${window.SITE_NAME}`}>
        <>
          <Header history={history} />
          <PageHeader product={product} versionLabel={version.label} />
          {product.is_allowed ? (
            <BodyContainer>
              {product.most_recent_version && !isMostRecent ? (
                <OldVersionWarning
                  link={routes.version_detail(
                    product.slug,
                    product.most_recent_version.label,
                  )}
                />
              ) : null}
              <BodySection>
                {isCardLayout && VersionDetail.getProductDescription(product)}
                <p>{version.description}</p>
                {!isCardLayout && (
                  <>
                    {primary_plan && visiblePrimaryPlan ? (
                      <p>
                        <Link
                          to={routes.plan_detail(
                            product.slug,
                            version.label,
                            primary_plan.slug,
                          )}
                          className="slds-button
                            slds-button_brand
                            slds-size_full"
                        >
                          {i18n.t('{{title}} - View Details', {
                            title: primary_plan.title,
                          })}
                        </Link>
                      </p>
                    ) : null}
                    {secondary_plan && visibleSecondaryPlan ? (
                      <p>
                        <Link
                          to={routes.plan_detail(
                            product.slug,
                            version.label,
                            secondary_plan.slug,
                          )}
                          className="slds-button
                            slds-button_outline-brand
                            slds-size_full"
                        >
                          {i18n.t('{{title}} - View Details', {
                            title: secondary_plan.title,
                          })}
                        </Link>
                      </p>
                    ) : null}
                  </>
                )}
                <BackLink
                  label={i18n.t('Select a different product')}
                  url={routes.product_list()}
                />
                {!isCardLayout && additionalPlansSorted.length ? (
                  <div className="slds-p-top_x-large">
                    {visiblePrimaryPlan || visibleSecondaryPlan ? (
                      <h2 className="slds-text-heading_small">
                        {i18n.t('Additional Plans')}
                      </h2>
                    ) : null}
                    {additionalPlansSorted.map((plan) => (
                      <p key={plan.id}>
                        <Link
                          to={routes.plan_detail(
                            product.slug,
                            version.label,
                            plan.slug,
                          )}
                        >
                          {plan.title}
                        </Link>
                      </p>
                    ))}
                  </div>
                ) : null}
              </BodySection>
              {isCardLayout ? (
                <div
                  className="slds-text-longform
                    slds-size_1-of-1"
                >
                  <PlanCards
                    product={product}
                    version={version}
                    additionalPlans={additionalPlansSorted}
                  />
                </div>
              ) : (
                <BodySection>
                  {VersionDetail.getProductDescription(product)}
                </BodySection>
              )}
            </BodyContainer>
          ) : (
            <ProductNotAllowed
              isLoggedIn={user !== null}
              message={product.not_allowed_instructions}
              link={
                <Trans i18nKey="productNotAllowed">
                  Try the{' '}
                  <Link to={routes.product_list()}>list of all products</Link>
                </Trans>
              }
            />
          )}
        </>
      </DocumentTitle>
    );
  }
}

const WrappedProductDetail = productConnector(ProductDetail);
const WrappedVersionDetail = versionConnector(withRouter(VersionDetail));

export {
  WrappedProductDetail as ProductDetail,
  WrappedVersionDetail as VersionDetail,
};
