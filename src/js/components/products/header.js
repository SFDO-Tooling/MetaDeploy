// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';

import ProductIcon from 'components/products/icon';
import type { Product as ProductType } from 'store/products/reducer';

const Header = ({
  product,
  versionLabel,
}: {
  product: ProductType,
  versionLabel: string,
}): React.Node => (
  <PageHeader
    className="page-header
      slds-p-around_x-large"
    title={product.title}
    info={versionLabel}
    icon={<ProductIcon item={product} />}
  />
);

export default Header;
