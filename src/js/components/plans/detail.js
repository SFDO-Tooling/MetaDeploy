// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import DocumentTitle from 'react-document-title';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import routes from 'utils/routes';
import { fetchVersion } from 'products/actions';
import { gatekeeper } from 'products/utils';
import {
  selectProduct,
  selectVersion,
  selectVersionLabel,
} from 'components/products/detail';
import { selectUserState } from 'components/header';

import BodyContainer from 'components/bodyContainer';
import Login from 'components/header/login';
import ProductIcon from 'components/products/icon';
import ProductNotFound from 'components/products/product404';
import StepsTable from 'components/plans/stepsTable';

import type { Match } from 'react-router-dom';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';
import type { User as UserType } from 'accounts/reducer';

const PlanDetail = ({
  user,
  product,
  version,
  versionLabel,
  plan,
  doFetchVersion,
}: {
  user: UserType,
  product: ProductType | null,
  version: VersionType | null,
  versionLabel: ?string,
  plan: PlanType | null,
  doFetchVersion: typeof fetchVersion,
}) => {
  const blocked = gatekeeper({
    product,
    version,
    versionLabel,
    plan,
    doFetchVersion,
  });
  if (blocked !== false) {
    return blocked;
  }
  // this redundant check is required to satisfy Flow:
  // https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations
  /* istanbul ignore if */
  if (!product || !version || !plan) {
    return <ProductNotFound />;
  }
  return (
    <DocumentTitle title={`${plan.title} | ${product.title} | MetaDeploy`}>
      <>
        <PageHeader
          className="page-header
            slds-p-around_x-large"
          title={plan.title}
          trail={[
            <Link
              to={routes.version_detail(product.slug, version.label)}
              key={product.slug}
            >
              {product.title}, {version.label}
            </Link>,
          ]}
          icon={<ProductIcon item={product} />}
          variant="objectHome"
        />
        <BodyContainer>
          <div
            className="slds-p-around_medium
              slds-size_1-of-1
              slds-medium-size_1-of-2"
          >
            <div className="slds-text-longform">
              <h3 className="slds-text-heading_small">{plan.title}</h3>
              {plan.preflight_message ? <p>{plan.preflight_message}</p> : null}
            </div>
            {user && user.valid_token_for !== null ? (
              <Button
                className="slds-size_full
                  slds-p-vertical_xx-small"
                label="Start Pre-Install Validation"
                variant="brand"
                disabled={!plan.steps.length}
              />
            ) : (
              <Login
                id="plan-detail-login"
                buttonClassName="slds-size_full
                  slds-p-vertical_xx-small"
                triggerClassName="slds-size_full"
                label="Log In to Start Pre-Install Validation"
                disabled={!plan.steps.length}
              />
            )}
          </div>
          {plan.steps.length ? (
            <div
              className="slds-p-around_medium
                slds-size_1-of-1"
            >
              <StepsTable plan={plan} />
            </div>
          ) : null}
        </BodyContainer>
      </>
    </DocumentTitle>
  );
};

const selectPlanSlug = (
  appState,
  { match: { params } }: { match: Match },
): ?string => params.planSlug;

const selectPlan = createSelector(
  [selectProduct, selectVersion, selectPlanSlug],
  (
    product: ProductType | null,
    version: VersionType | null,
    planSlug: ?string,
  ): PlanType | null => {
    if (!product || !version || !planSlug) {
      return null;
    }
    if (version.primary_plan.slug === planSlug) {
      return version.primary_plan;
    }
    if (version.secondary_plan && version.secondary_plan.slug === planSlug) {
      return version.secondary_plan;
    }
    const plan = version.additional_plans.find(p => p.slug === planSlug);
    return plan || null;
  },
);

const select = (appState, props) => ({
  user: selectUserState(appState),
  product: selectProduct(appState, props),
  version: selectVersion(appState, props),
  versionLabel: selectVersionLabel(appState, props),
  plan: selectPlan(appState, props),
});

const actions = {
  doFetchVersion: fetchVersion,
};

export default connect(
  select,
  actions,
)(PlanDetail);
