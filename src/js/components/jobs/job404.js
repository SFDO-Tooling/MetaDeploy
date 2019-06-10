// @flow

import * as React from 'react';
import i18n from 'i18next';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

import routes from 'utils/routes';
import FourOhFour from 'components/404';
import Login from 'components/header/login';
import type { Plan as PlanType } from 'store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';

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
        <Trans i18nKey="installationNotFound">
          We can’t find the installation you’re looking for. Try{' '}
          <Link to={routes.plan_detail(product.slug, version.label, plan.slug)}>
            starting a new installation
          </Link>
          ?
        </Trans>
      }
    />
    <div className="slds-align_absolute-center">
      <Login
        id="job-404-login"
        label={
          isLoggedIn ? i18n.t('Log In With a Different Org') : i18n.t('Log In')
        }
        buttonClassName="slds-p-horizontal_xxx-small"
        buttonVariant="base"
      />
    </div>
  </>
);

export default JobNotFound;
