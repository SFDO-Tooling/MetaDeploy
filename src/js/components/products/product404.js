// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

const ProductNotFound = () => (
  <FourOhFour
    message={
      <>
        We can’t find the product you’re looking for. Try the{' '}
        <Link to={routes.product_list()}>list of all products</Link>?
      </>
    }
  />
);

export default ProductNotFound;
