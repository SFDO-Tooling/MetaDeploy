// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';

import Login from 'components/header/login';

import type {
  Plan as PlanType,
  Preflight as PreflightType,
} from 'plans/reducer';
import type { User as UserType } from 'accounts/reducer';
import typeof {
  fetchPreflight as FetchPreflightType,
  startPreflight as StartPreflightType,
} from 'plans/actions';

const btnClasses = 'slds-size_full slds-p-vertical_xx-small';

const LabelWithSpinner = ({ label }: { label: string }): React.Node => (
  <>
    <span className="slds-is-relative slds-m-right_large">
      <Spinner variant="inverse" size="small" />
    </span>
    {label}
  </>
);

const LoginBtn = ({ label }: { label: string }): React.Node => (
  <Login
    id="plan-detail-login"
    buttonClassName={btnClasses}
    buttonVariant="brand"
    triggerClassName="slds-size_full"
    label={label}
  />
);

const PreflightBtn = ({
  label,
  disabled,
  onClick,
}: {
  label: string | React.Node,
  disabled?: boolean,
  onClick?: () => void,
}): React.Node => (
  <Button
    className={btnClasses}
    label={label}
    variant="brand"
    onClick={onClick}
    disabled={disabled}
  />
);

class CtaButton extends React.Component<{
  user: UserType,
  plan: PlanType,
  preflight: ?PreflightType,
  doFetchPreflight: FetchPreflightType,
  doStartPreflight: StartPreflightType,
}> {
  getPreflightBtn(
    action: string,
    hasValidToken: boolean,
    runPreflight: boolean = false,
  ): React.Node {
    const { plan, doStartPreflight } = this.props;
    if (hasValidToken) {
      if (runPreflight) {
        return (
          <PreflightBtn
            label={action}
            onClick={() => {
              doStartPreflight(plan.id);
            }}
          />
        );
      }
      return <PreflightBtn label={action} />;
    }
    // Require login first...
    return <LoginBtn label={`Log In to ${action}`} />;
  }

  render(): React.Node {
    const { user, plan, preflight, doFetchPreflight } = this.props;
    if (!user) {
      // Require login first...
      return <LoginBtn label="Log In to Start Pre-Install Validation" />;
    }
    const hasValidToken = user.valid_token_for !== null;

    if (preflight === undefined) {
      // Fetch most recent preflight result (if any exists)
      doFetchPreflight(plan.id);
      return (
        <PreflightBtn
          label={<LabelWithSpinner label="Loading..." />}
          disabled
        />
      );
    }

    if (preflight === null) {
      // No prior preflight exists
      return this.getPreflightBtn(
        'Start Pre-Install Validation',
        hasValidToken,
        true,
      );
    }

    switch (preflight.status) {
      case 'started': {
        // Preflight in progress...
        return (
          <PreflightBtn
            label={
              <LabelWithSpinner label="Pre-Install Validation In Progress..." />
            }
            disabled
          />
        );
      }
      case 'complete': {
        if (preflight.is_valid && preflight.error_count === 0) {
          // Preflight is done, valid, and has no errors -- allow installation
          return this.getPreflightBtn('Install', hasValidToken);
        }
        // Prior preflight exists, but is no longer valid or has errors
        return this.getPreflightBtn(
          'Re-Run Pre-Install Validation',
          hasValidToken,
          true,
        );
      }
      case 'failed': {
        // Prior preflight exists, but failed for unknown reason
        return this.getPreflightBtn(
          'Re-Run Pre-Install Validation',
          hasValidToken,
          true,
        );
      }
    }
    return null;
  }
}

export default CtaButton;
