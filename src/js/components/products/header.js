// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import ProductIcon from 'components/products/icon';

import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const ProductHeader = ({
  product,
  version,
}: {
  product: ProductType,
  version: VersionType,
}) => (
  <Link
    to={routes.version_detail(product.slug, version.label)}
    className="slds-text-link_reset"
  >
    <PageHeader
      className="page-header
        slds-p-around_x-large"
      title={product.title}
      info={version.label}
      icon={<ProductIcon item={product} />}
    />
  </Link>
);

export default ProductHeader;
