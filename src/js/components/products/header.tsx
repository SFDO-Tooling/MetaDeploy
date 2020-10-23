import PageHeader from '@salesforce/design-system-react/components/page-header';
import * as React from 'react';

import ProductIcon from '@/components/products/icon';
import { Product } from '@/store/products/reducer';

const Header = ({
  product,
  versionLabel,
}: {
  product: Product;
  versionLabel: string;
}) => (
  <PageHeader
    className="page-header slds-p-around_x-large"
    trail={[
      <>
        {product.title}, {versionLabel}
      </>,
    ]}
    icon={<ProductIcon item={product} />}
    variant="object-home"
  />
);

export default Header;
