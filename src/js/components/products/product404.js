// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

import routes from 'utils/routes';
import FourOhFour from 'components/404';

const ProductNotFound = () => (
  <FourOhFour
    message={
      <Trans i18nKey="productNotFound">
        We can’t find the product you’re looking for. Try the{' '}
        <Link to={routes.product_list()}>list of all products</Link>?
      </Trans>
    }
  />
);

export default ProductNotFound;
