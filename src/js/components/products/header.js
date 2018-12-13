// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import ProductIcon from 'components/products/icon';

import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const Header = ({
  product,
  version,
  navRight,
}: {
  product: ProductType,
  version: VersionType,
  navRight?: React.Node,
}): React.Node => (
  <PageHeader
    className="page-header
      slds-p-around_x-large"
    title={product.title}
    info={version.label}
    navRight={
      navRight !== null && navRight !== undefined ? <>{navRight}</> : ''
    }
    icon={<ProductIcon item={product} />}
  />
);

export default Header;
