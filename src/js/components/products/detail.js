// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link, Redirect } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';
import { t } from 'i18next';

import routes from 'utils/routes';
import {
  fetchAdditionalPlans,
  fetchPlan,
  fetchVersion,
} from 'store/products/actions';
import {
  selectProduct,
  selectProductSlug,
  selectVersion,
  selectVersionLabelOrPlanSlug,
} from 'store/products/selectors';
import { selectUserState } from 'store/user/selectors';
import { getLoadingOrNotFound, shouldFetchVersion } from 'components/utils';
import BackLink from 'components/backLink';
import BodyContainer from 'components/bodyContainer';
import Header from 'components/products/header';
import ProductNotAllowed from 'components/products/notAllowed';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';
import type { AppState } from 'store';
import type { InitialProps } from 'components/utils';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';
import type { User as UserType } from 'store/user/reducer';
import type { VersionPlanType } from 'store/products/selectors';
import type { Plan as PlanType } from 'store/plans/reducer';

type ProductDetailProps = { product: ProductType | null, productSlug: ?string };
type VersionDetailProps = {
  user: UserType,
  product: ProductType | null,
  productSlug: ?string,
  version: VersionType | null,
  versionLabelAndPlanSlug: VersionPlanType,
  doFetchAdditionalPlans: typeof fetchAdditionalPlans,
  doFetchPlan: typeof fetchPlan,
  doFetchVersion: typeof fetchVersion,
};

const ProductDetail = ({ product, productSlug }: ProductDetailProps) => {
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
};

const BodySection = ({ children }: { children: ?React.Node }) => (
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
  fetchVersionIfMissing() {
    const {
      product,
      version,
      versionLabelAndPlanSlug,
      doFetchVersion,
    } = this.props;
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
    this.fetchVersionIfMissing();
    this.fetchAdditionalPlansIfMissing();
    this.fetchPlanIfMissing();
  }

  componentDidUpdate(prevProps) {
    const { product, version, versionLabelAndPlanSlug } = this.props;
    const { label, slug, maybeVersion, maybeSlug } = versionLabelAndPlanSlug;
    const versionChanged =
      product !== prevProps.product ||
      version !== prevProps.version ||
      label !== prevProps.versionLabelAndPlanSlug.label ||
      slug !== prevProps.versionLabelAndPlanSlug.slug ||
      maybeVersion !== prevProps.versionLabelAndPlanSlug.maybeVersion ||
      maybeSlug !== prevProps.versionLabelAndPlanSlug.maybeSlug;
    if (versionChanged) {
      this.fetchVersionIfMissing();
      this.fetchAdditionalPlansIfMissing();
      this.fetchPlanIfMissing();
    }
  }

  render(): React.Node {
    const {
      user,
      product,
      productSlug,
      version,
      versionLabelAndPlanSlug,
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
    const listedAdditionalPlans: Array<PlanType> = version.additional_plans
      ? (Object.entries(version.additional_plans): any)
          .filter(
            ([key, plan]: [string, PlanType | null]) =>
              plan && plan.is_listed && plan.is_allowed && key === plan.slug,
          )
          .map((item: Array<[string, PlanType]>) => item[1])
      : [];
    const { primary_plan, secondary_plan } = version;
    const visiblePrimaryPlan =
      primary_plan && primary_plan.is_listed && primary_plan.is_allowed;
    const visibleSecondaryPlan =
      secondary_plan && secondary_plan.is_listed && secondary_plan.is_allowed;
    const productDescriptionHasTitle =
      (product.description && product.description.startsWith('<h1>')) ||
      (product.description && product.description.startsWith('<h2>'));
    return (
      <DocumentTitle title={`${product.title} | ${window.SITE_NAME}`}>
        <>
          <Header product={product} versionLabel={version.label} />
          {product.is_allowed ? (
            <BodyContainer>
              <BodySection>
                <p>{version.description}</p>
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
                      {t('View Plan')}: {primary_plan.title}
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
                      {t('View Plan')}: {secondary_plan.title}
                    </Link>
                  </p>
                ) : null}
                <BackLink
                  label={t('Select a different product')}
                  url={routes.product_list()}
                />
                {listedAdditionalPlans.length ? (
                  <div className="slds-p-top_x-large">
                    {visiblePrimaryPlan || visibleSecondaryPlan ? (
                      <h2 className="slds-text-heading_small">
                        {t('Additional Plans')}
                      </h2>
                    ) : null}
                    {listedAdditionalPlans.map(plan => (
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
              <BodySection>
                {!productDescriptionHasTitle && (
                  <h2 className="slds-text-heading_small">
                    {t('About')} {product.title}
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
                <div
                  className="markdown"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </BodySection>
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

const selectProductDetail = (appState: AppState, props: InitialProps) => ({
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
});

const selectVersionDetail = (appState: AppState, props: InitialProps) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  productSlug: selectProductSlug(appState, props),
  version: selectVersion(appState, props),
  versionLabelAndPlanSlug: selectVersionLabelOrPlanSlug(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
  doFetchAdditionalPlans: fetchAdditionalPlans,
  doFetchPlan: fetchPlan,
};

const WrappedProductDetail: React.ComponentType<InitialProps> = connect(
  selectProductDetail,
)(ProductDetail);
const WrappedVersionDetail: React.ComponentType<InitialProps> = connect(
  selectVersionDetail,
  actions,
)(VersionDetail);

export {
  WrappedProductDetail as ProductDetail,
  WrappedVersionDetail as VersionDetail,
};
