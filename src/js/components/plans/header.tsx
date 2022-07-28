import PageHeader from '@salesforce/design-system-react/components/page-header';
import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import ProductIcon from '@/js/components/products/icon';
import { Job } from '@/js/store/jobs/reducer';
import { Plan } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';
import { getVersionLabel } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

const Header = ({
  product,
  version,
  plan,
  onRenderActions,
}: {
  product: Product;
  version: Version;
  plan: Plan;
  onRenderActions?: () => React.ReactNode;
  job?: Job;
  userLoggedIn?: boolean;
  scratchOrgCreated?: boolean;
  preflightStatus?: string | null | undefined;
  preflightIsValid?: boolean;
  preflightIsReady?: boolean;
}) => (
  <>
    <PageHeader
      className="page-header slds-p-around_x-large"
      title={plan.title}
      trail={[
        <Link
          to={routes.version_detail(
            product.slug,
            getVersionLabel(product, version),
          )}
          key={product.slug}
        >
          <Trans i18nKey="productWithVersion">
            {{ product: product.title }} {{ version: version.label }}
          </Trans>
        </Link>,
      ]}
      onRenderActions={onRenderActions ? onRenderActions : null}
      icon={<ProductIcon item={product} />}
      variant="object-home"
    />
  </>
);

export default Header;
