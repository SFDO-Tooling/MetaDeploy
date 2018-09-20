// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import type { Product as ProductType } from 'products/reducer';

const VersionNotFound = ({ product }: { product: ProductType }) => (
  <FourOhFour>
    <p>
      We can&rsquo;t find the version you&rsquo;re looking for. Try the&nbsp;
      <Link
        to={routes.version_detail(
          product.slug,
          product.most_recent_version.label,
        )}
      >
        most recent version
      </Link>
      &nbsp;of that product, or the&nbsp;
      <Link to={routes.product_list()}>list of all products</Link>?
    </p>
  </FourOhFour>
);

export default VersionNotFound;
