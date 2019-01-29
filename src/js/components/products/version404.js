// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import type { Product as ProductType } from 'products/reducer';

const VersionNotFound = ({ product }: { product: ProductType }) => (
  <FourOhFour
    message={
      <Trans i18nKey="versionNotFound">
        We can’t find the version you’re looking for. Try the{' '}
        {product.most_recent_version ? (
          <>
            <Link
              to={routes.version_detail(
                product.slug,
                product.most_recent_version.label,
              )}
            >
              most recent version
            </Link>{' '}
            of that product, or the{' '}
          </>
        ) : null}
        <Link to={routes.product_list()}>list of all products</Link>?
      </Trans>
    }
  />
);

export default VersionNotFound;
