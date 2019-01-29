// @flow

import * as React from 'react';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import FourOhFour from 'components/404';

import { Trans } from 'react-i18next';

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
  <FourOhFour
    message={
      <Trans i18nKey="planNotFound">
        We can’t find the plan you’re looking for. Try{' '}
        <Link to={routes.version_detail(product.slug, version.label)}>
          another plan
        </Link>{' '}
        from that product version?
      </Trans>
    }
  />
);

export default PlanNotFound;
