import PageHeader from '@salesforce/design-system-react/components/page-header';
import * as React from 'react';
import { Link } from 'react-router-dom';

import JobProgressIndicator from '@/components/jobs/progressIndicator';
import PlanProgressIndicator from '@/components/plans/progressIndicator';
import ProductIcon from '@/components/products/icon';
import { Job } from '@/store/jobs/reducer';
import { Plan } from '@/store/plans/reducer';
import { Product, Version } from '@/store/products/reducer';
import routes from '@/utils/routes';

const Header = ({
  product,
  version,
  plan,
  onRenderActions,
  job,
  userLoggedIn,
  preflightStatus,
  preflightIsValid,
  preflightIsReady,
}: {
  product: Product;
  version: Version;
  plan: Plan;
  onRenderActions?: () => React.ReactNode;
  job?: Job;
  userLoggedIn?: boolean;
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
          to={routes.version_detail(product.slug, version.label)}
          key={product.slug}
        >
          {product.title}, {version.label}
        </Link>,
      ]}
      onRenderActions={onRenderActions ? onRenderActions : null}
      icon={<ProductIcon item={product} />}
      variant="object-home"
    />
    {job ? (
      <JobProgressIndicator job={job} />
    ) : (
      <PlanProgressIndicator
        userLoggedIn={userLoggedIn}
        preflightStatus={preflightStatus}
        preflightIsValid={preflightIsValid}
        preflightIsReady={preflightIsReady}
      />
    )}
  </>
);

export default Header;
