// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { fetchVersion } from 'products/actions';
import { gatekeeper } from 'products/utils';
import {
  selectProduct,
  selectVersion,
  selectVersionLabel,
} from 'components/products/detail';

import BodyContainer from 'components/bodyContainer';
import ProductHeader from 'components/products/header';
import ProductNotFound from 'components/products/product404';

import type { Match } from 'react-router-dom';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const PlanDetail = ({
  product,
  version,
  versionLabel,
  plan,
  doFetchVersion,
}: {
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
      <div>
        <ProductHeader product={product} version={version} />
        <BodyContainer>
          <div
            className="slds-text-longform
              slds-p-around_medium
              slds-size_1-of-1
              slds-medium-size_1-of-2"
          >
            <h3 className="slds-text-heading_small">Preflight</h3>
            <p>{plan.preflight_message}</p>
          </div>
        </BodyContainer>
      </div>
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
