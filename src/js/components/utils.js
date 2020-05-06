// @flow

import * as React from 'react';
import Spinner from '@salesforce/design-system-react/components/spinner';
import { Redirect } from 'react-router-dom';
import type { Match, RouterHistory } from 'react-router-dom';

import JobNotFound from 'components/jobs/job404';
import PlanNotFound from 'components/plans/plan404';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';
import routes from 'utils/routes';
import type { Job as JobType } from 'store/jobs/reducer';
import type { Plan as PlanType } from 'store/plans/reducer';
import type {
  Product as ProductType,
  Version as VersionType,
} from 'store/products/reducer';

export type InitialProps = {| match: Match, history: RouterHistory |};

type TransientMessageState = {
  transientMessageVisible: boolean,
};
export type TransientMessageProps = {|
  transientMessageVisible?: boolean,
  showTransientMessage?: () => void,
  hideTransientMessage?: () => void,
|};

export const withTransientMessage = function <
  Props: {},
  Component: React.ComponentType<Props>,
>(
  WrappedComponent: Component,
  options?: { duration?: number },
): Class<
  React.Component<$Diff<Props, TransientMessageProps>, TransientMessageState>,
> {
  const defaults = {
    duration: 5 * 1000,
  };
  const opts = { ...defaults, ...options };
  return class WithTransientMessage extends React.Component<
    Props,
    TransientMessageState,
  > {
    timeout: ?TimeoutID;

    constructor(props: Props) {
      super(props);
      this.state = { transientMessageVisible: false };
      this.timeout = null;
    }

    componentWillUnmount() {
      this.clearTimeout();
    }

    clearTimeout() {
      if (this.timeout !== undefined && this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    }

    showTransientMessage = () => {
      this.setState({ transientMessageVisible: true });
      this.clearTimeout();
      this.timeout = setTimeout(() => {
        this.hideTransientMessage();
      }, opts.duration);
    };

    hideTransientMessage = () => {
      this.setState({ transientMessageVisible: false });
      this.clearTimeout();
    };

    render(): React.Node {
      return (
        <WrappedComponent
          {...this.props}
          transientMessageVisible={this.state.transientMessageVisible}
          showTransientMessage={this.showTransientMessage}
          hideTransientMessage={this.hideTransientMessage}
        />
      );
    }
  };
};

export const shouldFetchVersion = ({
  product,
  version,
  versionLabel,
}: {
  product: ProductType | null | void,
  version?: VersionType | null,
  versionLabel?: ?string,
}): boolean => {
  const hasVersion = version !== null;
  if (product && !hasVersion && versionLabel) {
    const version404 =
      product && product.versions && product.versions[versionLabel] === null;
    if (!version404) {
      // Fetch version from API
      return true;
    }
  }
  return false;
};

export const shouldFetchPlan = ({
  version,
  plan,
  planSlug,
}: {
  version: VersionType | null,
  plan?: PlanType | null,
  planSlug?: ?string,
}): boolean => {
  const hasVersion = version !== null;
  const hasPlan = plan !== null;
  if (hasVersion && !hasPlan && planSlug) {
    const plan404 =
      version &&
      version.additional_plans &&
      version.additional_plans[planSlug] === null;
    if (!plan404) {
      // Fetch plan from API
      return true;
    }
  }
  return false;
};

export const getLoadingOrNotFound = ({
  product,
  productSlug,
  version,
  versionLabel,
  plan,
  planSlug,
  job,
  jobId,
  isLoggedIn,
  route,
  maybeVersion,
  maybeSlug,
}: {
  product: ProductType | null | void,
  productSlug: ?string,
  version?: VersionType | null,
  versionLabel?: ?string,
  plan?: PlanType | null,
  planSlug?: ?string,
  job?: JobType | null,
  jobId?: ?string,
  isLoggedIn?: boolean,
  route: string,
  maybeVersion?: string,
  maybeSlug?: string,
}): React.Node | false => {
  if (!product) {
    if (!productSlug || product === null) {
      return <ProductNotFound />;
    }
    // Fetching product from API
    return <Spinner />;
  }
  // If we have what we think might be a version label and plan slug,
  // return a spinner while checking if plan exists on that version.
  if (maybeVersion && maybeSlug) {
    return <Spinner />;
  }
  // If we have a plan slug but no plan, redirect to that plan detail page
  if (planSlug && versionLabel && plan === undefined) {
    return (
      <Redirect to={routes.plan_detail(product.slug, versionLabel, planSlug)} />
    );
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
    if (
      !planSlug ||
      (version.additional_plans && version.additional_plans[planSlug] === null)
    ) {
      return <PlanNotFound product={product} version={version} />;
    }
    // Fetching plan from API
    return <Spinner />;
  }
  if (version && plan && jobId && !job) {
    if (job === null) {
      return (
        <JobNotFound
          product={product}
          version={version}
          plan={plan}
          isLoggedIn={isLoggedIn}
        />
      );
    }
    // Fetching job from API
    return <Spinner />;
  }
  // Redirect to most recent product/plan slug
  if (
    route &&
    ((productSlug && productSlug !== product.slug) ||
      (plan && planSlug && planSlug !== plan.slug))
  ) {
    return (
      <Redirect
        to={routes[route](
          product.slug,
          (version && version.label) || versionLabel,
          (plan && plan.slug) || planSlug,
          (job && job.id) || jobId,
        )}
      />
    );
  }
  return false;
};
