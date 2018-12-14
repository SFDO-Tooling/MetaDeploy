// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import ProductIcon from 'components/products/icon';
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
}: {
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  navRight?: React.Node,
}) => (
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
);

export default Header;
