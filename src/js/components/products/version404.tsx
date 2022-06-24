import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import { Product } from '@/js/store/products/reducer';
import { LATEST_VERSION } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

const VersionNotFound = ({ product }: { product: Product }) => (
  <FourOhFour
    message={
      product.most_recent_version ? (
        <Trans i18nKey="versionNotFoundMostRecent">
          We can’t find the version you’re looking for. Try the{' '}
          <Link to={routes.version_detail(product.slug, LATEST_VERSION)}>
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
