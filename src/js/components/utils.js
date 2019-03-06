// @flow

import * as React from 'react';
import Spinner from '@salesforce/design-system-react/components/spinner';
import type { Match, RouterHistory } from 'react-router-dom';
import { Redirect } from 'react-router-dom';

import PlanNotFound from 'components/plans/plan404';
import ProductNotFound from 'components/products/product404';
import VersionNotFound from 'components/products/version404';
import JobNotFound from 'components/jobs/job404';
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

export const withTransientMessage = function<
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

export const getLoadingOrNotFound = ({
  product,
  version,
  versionLabel,
  plan,
  planSlug,
  job,
  jobId,
  isLoggedIn,
}: {
  product: ProductType | null,
  version?: VersionType | null,
  versionLabel?: ?string,
  plan?: PlanType | null,
  planSlug?: ?string,
  job?: JobType | null,
  jobId?: ?string,
  isLoggedIn?: boolean,
}): React.Node | false => {
  if (product === null) {
    return <ProductNotFound />;
  }
  if (planSlug && versionLabel && !plan) {
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
    return <PlanNotFound product={product} version={version} />;
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
  return false;
};
