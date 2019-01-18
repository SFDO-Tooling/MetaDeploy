// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import ProductIcon from 'components/products/icon';
import InstallProgressIndicator from 'components/installProgressIndicator';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

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
  userLoggedIn,
  preflightStatus,
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  navRight?: React.Node,
  userLoggedIn: boolean,
  preflightStatus: ?string,
}) => {
  let activeStep;
  if (!userLoggedIn) {
    activeStep = 0;
  } else if (preflightStatus === null) {
    activeStep = 1;
  } else {
    activeStep = 2;
  }
  return (
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
        navRight={
          navRight !== null && navRight !== undefined ? <>{navRight}</> : ''
        }
        icon={<ProductIcon item={product} />}
        variant="objectHome"
      />
      <InstallProgressIndicator
        activeStep={activeStep}
        status={preflightStatus}
      />
    </>
  );
};

export default Header;
