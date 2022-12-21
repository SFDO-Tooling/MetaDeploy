import PageHeader from '@salesforce/design-system-react/components/page-header';
import React, { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import ProductIcon from '@/js/components/products/icon';
import { Job } from '@/js/store/jobs/reducer';
import { Plan } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';

const Header = ({
  product,
  version,
  plan,
  onRenderActions,
}: {
  product: Product;
  version: Version;
  plan: Plan;
  onRenderActions?: () => ReactNode;
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
        <Trans i18nKey="productWithVersion" key={product.slug}>
          {{ product: product.title }} {{ version: version.label }}
        </Trans>,
      ]}
      onRenderActions={onRenderActions ? onRenderActions : null}
      icon={<ProductIcon item={product} />}
      variant="object-home"
    />
  </>
);

export default Header;
