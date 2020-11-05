import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import * as React from 'react';

import ProductIcon from '@/components/products/icon';
import { Product } from '@/store/products/reducer';
import { PRODUCT_LAYOUTS } from '@/utils/constants';

const Header = ({
  product,
  versionLabel,
}: {
  product: Product;
  versionLabel: string;
}) => (
  <PageHeader
    className="page-header slds-p-around_x-large"
    title={
      product.layout === PRODUCT_LAYOUTS.Card
        ? product.title
        : i18n.t('Select a Plan')
    }
    trail={
      product.layout === PRODUCT_LAYOUTS.Card
        ? []
        : [
            <>
              {product.title}, {versionLabel}
            </>,
          ]
    }
    icon={<ProductIcon item={product} />}
    variant="object-home"
  />
);

export default Header;
