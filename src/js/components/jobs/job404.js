// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';
import Login from 'components/header/login';

import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const JobNotFound = ({
  product,
  version,
  plan,
  isLoggedIn,
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  isLoggedIn?: boolean,
}) => (
  <>
    <FourOhFour
      message={
        <>
          We can’t find the installation you’re looking for. Try{' '}
          <Link to={routes.plan_detail(product.slug, version.label, plan.slug)}>
            starting a new installation
          </Link>
          ?
        </>
      }
    />
    <div className="slds-align_absolute-center">
      <Login
        id="job-404-login"
        label={isLoggedIn ? 'Log In With a Different Org' : 'Log In'}
        buttonClassName="slds-p-horizontal_xxx-small"
        buttonVariant="base"
        nubbinPosition="top"
      />
    </div>
  </>
);

export default JobNotFound;
