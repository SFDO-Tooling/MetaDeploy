// @flow

import * as React from 'react';
import Spinner from '@salesforce/design-system-react/components/spinner';

import PlanNotFound from 'components/plans/plan404';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';
import JobNotFound from 'components/jobs/job404';

import type { Job as JobType } from 'jobs/reducer';
import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';
import type { User as UserType } from 'accounts/reducer';

export const shouldFetchVersion = ({
  product,
  version,
  versionLabel,
}: {
  product: ProductType | null,
  version?: VersionType | null,
  versionLabel?: ?string,
}): boolean => {
  const hasProduct = product !== null;
  const hasVersion = version !== null;
  if (hasProduct && !hasVersion && versionLabel) {
    const version404 =
      product && product.versions && product.versions[versionLabel] === null;
    if (!version404) {
      // Fetch version from API
      return true;
    }
  }
  return false;
};

export const gatekeeper = ({
  product,
  version,
  versionLabel,
  plan,
  job,
  jobId,
  user,
}: {
  product: ProductType | null,
  version?: VersionType | null,
  versionLabel?: ?string,
  plan?: PlanType | null,
  job?: JobType | null,
  jobId?: ?string,
  user?: UserType,
}): React.Node | false => {
  if (product === null) {
    return <ProductNotFound />;
  }
  if (version === null) {
    if (
      !versionLabel ||
      (product.versions && product.versions[versionLabel] === null)
    ) {
      // Versions have already been fetched...
      return <VersionNotFound product={product} />;
    }
    // Fetching version from API
    return <Spinner />;
  }
  if (plan === null) {
    if (!version) {
      return <VersionNotFound product={product} />;
    }
    return <PlanNotFound product={product} version={version} />;
  }
  if (version && plan && jobId && !job) {
    if (job === null) {
      return (
        <JobNotFound
          product={product}
          version={version}
          plan={plan}
          user={user}
        />
      );
    }
    // Fetching job from API
    return <Spinner />;
  }
  return false;
};
