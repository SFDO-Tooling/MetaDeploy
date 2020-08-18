import i18n from 'i18next';
import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import Login from '@/components/header/login';
import { Plan } from '@/store/plans/reducer';
import { Product, Version } from '@/store/products/reducer';
import routes from '@/utils/routes';

const JobNotFound = ({
  product,
  version,
  plan,
  isLoggedIn,
}: {
  product: Product;
  version: Version;
  plan: Plan;
  isLoggedIn?: boolean;
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
