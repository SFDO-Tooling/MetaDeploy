// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const Intro = ({
  product,
  version,
  plan,
  results,
  cta,
  preMessage,
  postMessage,
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  results: React.Node,
  cta: React.Node,
  preMessage?: React.Node,
  postMessage?: React.Node,
}): React.Node => (
  <div
    className="slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
  >
    <div className="slds-text-longform">
      <h2 className="slds-text-heading_large">{plan.title}</h2>
      <div className="slds-p-vertical_medium">
        <p className="slds-text-heading_small">
          This plan is part of <strong>{product.title}</strong>, {version.label}
        </p>
        <p>
          <Link to={routes.version_detail(product.slug, version.label)}>
            View available plans
          </Link>
        </p>
      </div>
      {preMessage}
      {results}
      {postMessage}
    </div>
    {cta}
  </div>
);

export default Intro;
