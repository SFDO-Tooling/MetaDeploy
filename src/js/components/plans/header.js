// @flow

import * as React from 'react';
import JobProgressIndicator from 'components/jobs/progressIndicator';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PlanProgressIndicator from 'components/plans/progressIndicator';
import ProductIcon from 'components/products/icon';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import i18n from 'i18n';

import routes from 'utils/routes';

import type { Job as JobType } from 'jobs/reducer';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const Header = ({
  product,
  version,
  plan,
  navRight,
  job,
  userLoggedIn,
  preflightStatus,
  preflightIsValid,
  preflightIsReady,
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  navRight?: React.Node,
  job?: JobType,
  userLoggedIn?: boolean,
  preflightStatus?: ?string,
  preflightIsValid?: boolean,
  preflightIsReady?: boolean,
}) => (
  <>
    <PageHeader
      className="page-header
      slds-p-around_x-large"
      title={i18n.t(plan.title)}
      trail={[
        <Link
          to={routes.version_detail(product.slug, version.label)}
          key={product.slug}
        >
          <Trans i18nKey="productTitleVersionLabel">
            {product.title}, {version.label}
          </Trans>
        </Link>,
      ]}
      navRight={
        navRight !== null && navRight !== undefined ? <>{navRight}</> : ''
      }
      icon={<ProductIcon item={product} />}
      variant="objectHome"
    />
    {job ? (
      <JobProgressIndicator job={job} />
    ) : (
      <PlanProgressIndicator
        userLoggedIn={userLoggedIn}
        preflightStatus={preflightStatus}
        preflightIsValid={preflightIsValid}
        preflightIsReady={preflightIsReady}
      />
    )}
  </>
);

export default Header;
