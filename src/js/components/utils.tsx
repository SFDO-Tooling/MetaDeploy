import Spinner from '@salesforce/design-system-react/components/spinner';
import React, { Component, ComponentType, useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';

import JobNotFound from '@/js/components/jobs/job404';
import PlanNotFound from '@/js/components/plans/plan404';
import ProductNotFound from '@/js/components/products/product404';
import VersionNotFound from '@/js/components/products/version404';
import { Job } from '@/js/store/jobs/reducer';
import { Plan } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';
import { LATEST_VERSION } from '@/js/utils/constants';
import { getVersionLabel } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

type TransientMessageState = {
  transientMessageVisible: boolean;
};
export type TransientMessageProps = {
  transientMessageVisible?: boolean;
  showTransientMessage?: () => void;
  hideTransientMessage?: () => void;
};

export const withTransientMessage = function <Props>(
  WrappedComponent: ComponentType<Props & TransientMessageProps>,
  options?: { duration?: number },
) {
  const defaults = {
    duration: 5 * 1000,
  };
  const opts = { ...defaults, ...options };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return class WithTransientMessage extends Component<
    Props,
    TransientMessageState
  > {
    timeout: NodeJS.Timeout | null | undefined;

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

    render() {
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
  product: Product | null | void;
  version?: Version | null;
  versionLabel?: string | null | undefined;
}): boolean => {
  const hasVersion = version !== null;
  if (product && !hasVersion && versionLabel) {
    const version404 = product?.versions?.[versionLabel] === null;
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
  version: Version | null;
  plan?: Plan | null;
  planSlug?: string | null | undefined;
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
  product: Product | null | void;
  productSlug: string | null | undefined;
  version?: Version | null;
  versionLabel?: string | null | undefined;
  plan?: Plan | null;
  planSlug?: string | null | undefined;
  job?: Job | null;
  jobId?: string | null | undefined;
  isLoggedIn?: boolean;
  route: 'product_detail' | 'version_detail' | 'plan_detail' | 'job_detail';
  maybeVersion?: string;
  maybeSlug?: string;
}) => {
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
      <Redirect
        to={routes.plan_detail(product.slug, LATEST_VERSION, planSlug)}
      />
    );
  }
  if (version === null) {
    if (!versionLabel || product.versions?.[versionLabel] === null) {
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
    if (!planSlug || version.additional_plans?.[planSlug] === null) {
      return <PlanNotFound product={product} version={version} />;
    }
    // Fetching plan from API
    return <Spinner />;
  }
  if (version && plan && jobId && !job) {
    if (job === null) {
      return (
        <JobNotFound
          url={routes.plan_detail(
            product.slug,
            getVersionLabel(product, version),
            plan.slug,
          )}
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
        to={(routes[route] as (...args: any[]) => string)(
          product.slug,
          version?.label || versionLabel,
          plan?.slug || planSlug,
          job?.id || jobId,
        )}
      />
    );
  }
  return false;
};

// This is often considered an anti-pattern in React, but we consider it
// acceptable in cases where we don't want to cancel or cleanup an asynchronous
// action on unmount -- we just want to prevent a post-unmount state update
// after the action finishes.
// https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
export const useIsMounted = () => {
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );
  return isMounted;
};
