// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import ProductIcon from 'components/products/icon';
import { t } from 'i18next';

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
    title={t(product.title)}
    info={t(versionLabel)}
    icon={<ProductIcon item={product} />}
  />
);

export default Header;
