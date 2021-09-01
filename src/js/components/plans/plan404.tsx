import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import { Product, Version } from '@/js/store/products/reducer';
import { getVersionLabel } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

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
        <Link
          to={routes.version_detail(
            product.slug,
            getVersionLabel(product, version),
          )}
        >
          another plan
        </Link>{' '}
        from that product version?
      </Trans>
    }
  />
);

export default PlanNotFound;
