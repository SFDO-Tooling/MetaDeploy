import PageHeader from '@salesforce/design-system-react/components/page-header';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
}) => {
  const { t } = useTranslation();

  return (
    <PageHeader
      className="page-header slds-p-around_x-large"
      title={
        product.layout === PRODUCT_LAYOUTS.Card
          ? product.title
          : t('Select a Plan')
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
};

export default Header;
