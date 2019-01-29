// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import ProductIcon from 'components/products/icon';
import * as i18n from 'i18next';

import type { Product as ProductType } from 'products/reducer';

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
    title={i18n.t(product.title)}
    info={i18n.t(versionLabel)}
    icon={<ProductIcon item={product} />}
  />
);

export default Header;
