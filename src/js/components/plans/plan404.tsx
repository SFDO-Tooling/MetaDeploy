import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Product, Version } from '@/store/products/reducer';
import routes from '@/utils/routes';

const PlanNotFound = ({
  product,
  version,
}: {
  product: Product;
  version: Version;
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
