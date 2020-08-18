import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Product } from '@/store/products/reducer';
import routes from '@/utils/routes';

const VersionNotFound = ({ product }: { product: Product }) => (
  <FourOhFour
    message={
      product.most_recent_version ? (
        <Trans i18nKey="versionNotFoundMostRecent">
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
        </Trans>
      ) : (
        <Trans i18nKey="versionNotFound">
          We can’t find the version you’re looking for. Try the{' '}
          <Link to={routes.product_list()}>list of all products</Link>?
        </Trans>
      )
    }
  />
);

export default VersionNotFound;
