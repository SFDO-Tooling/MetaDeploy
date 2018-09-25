// @flow

import * as React from 'react';
import Spinner from '@salesforce/design-system-react/components/spinner';

import PlanNotFound from 'components/plans/plan404';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';

import type { Plan as PlanType } from 'plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'products/reducer';
import typeof { fetchVersion as FetchVersionType } from 'products/actions';

export const gatekeeper = ({
  product,
  version,
  versionLabel,
  plan,
  doFetchVersion,
}: {
  product: ProductType | null,
  version?: VersionType | null,
  versionLabel?: ?string,
  plan?: PlanType | null,
  doFetchVersion?: FetchVersionType,
}): React.Node | false => {
  if (product === null) {
    return <ProductNotFound />;
  }
  if (version === null) {
    if (
      !versionLabel ||
      !doFetchVersion ||
      (product.versions && product.versions[versionLabel] === null)
    ) {
      // Versions have already been fetched...
      return <VersionNotFound product={product} />;
    }
    // Fetch version from API
    doFetchVersion({ product: product.id, label: versionLabel });
    return <Spinner />;
  }
  if (plan === null) {
    if (!version) {
      return <VersionNotFound product={product} />;
    }
    return <PlanNotFound product={product} version={version} />;
  }
  return false;
};
