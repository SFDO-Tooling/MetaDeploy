import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import * as React from 'react';
import { Trans } from 'react-i18next';

import ProductIcon from '@/js/components/products/icon';
import { Product } from '@/js/store/products/reducer';
import { PRODUCT_LAYOUTS } from '@/js/utils/constants';

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
            <Trans i18nKey="productWithVersion" key={product.slug}>
              {{ product: product.title }} {{ version: versionLabel }}
            </Trans>,
          ]
    }
    icon={<ProductIcon item={product} />}
    variant="object-home"
  />
);

export default Header;
