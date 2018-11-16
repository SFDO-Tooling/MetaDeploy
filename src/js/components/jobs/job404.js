// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const JobNotFound = ({
  product,
  version,
  plan,
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
}) => (
  <FourOhFour
    message={
      <>
        We can’t find the installation you’re looking for. Try running a new
        installation on{' '}
        <Link to={routes.plan_detail(product.slug, version.label, plan.slug)}>
          this plan
        </Link>
        ?
      </>
    }
  />
);

export default JobNotFound;
