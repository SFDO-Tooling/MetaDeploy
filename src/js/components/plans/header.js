// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';

import JobProgressIndicator from 'components/jobs/progressIndicator';
import PlanProgressIndicator from 'components/plans/progressIndicator';
import ProductIcon from 'components/products/icon';
import routes from 'utils/routes';
import type { Job as JobType } from 'store/jobs/reducer';
import type { Plan as PlanType } from 'store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';

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
  product: ProductType,
  version: VersionType,
  plan: PlanType,
  onRenderActions?: () => React.Node,
  job?: JobType,
  userLoggedIn?: boolean,
  preflightStatus?: ?string,
  preflightIsValid?: boolean,
  preflightIsReady?: boolean,
}) => (
  <>
    <PageHeader
      className="page-header
        slds-p-around_x-large"
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
