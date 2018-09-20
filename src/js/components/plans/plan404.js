// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';

const PlanNotFound = ({
  product,
  version,
}: {
  product: ProductType,
  version: VersionType,
}) => (
  <FourOhFour>
    <p>
      We can&rsquo;t find the plan you&rsquo;re looking for. Try&nbsp;
      <Link to={routes.version_detail(product.slug, version.label)}>
        another plan
      </Link>
      &nbsp;from that product version?
    </p>
  </FourOhFour>
);

export default PlanNotFound;
