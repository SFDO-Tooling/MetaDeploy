// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { t } from 'i18next';

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
    title={t('Select a Plan')}
    trail={[
      <>
        {product.title}, {versionLabel}
      </>,
    ]}
    icon={<ProductIcon item={product} />}
    variant="objectHome"
  />
);

export default Header;
