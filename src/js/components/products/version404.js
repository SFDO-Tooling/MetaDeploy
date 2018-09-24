// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import type { Product as ProductType } from 'products/reducer';

const VersionNotFound = ({ product }: { product: ProductType }) => (
  <FourOhFour>
    <p>
      We can’t find the version you’re looking for. Try the{' '}
      <Link
        to={routes.version_detail(
          product.slug,
          product.most_recent_version.label,
        )}
      >
        most recent version
      </Link>{' '}
      of that product, or the{' '}
      <Link to={routes.product_list()}>list of all products</Link>?
    </p>
  </FourOhFour>
);

export default VersionNotFound;
