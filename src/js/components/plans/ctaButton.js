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

const CtaButton = ({
  user,
  plan,
  preflight,
  doFetchPreflight,
  doStartPreflight,
}: {
  user: UserType,
  plan: PlanType,
  preflight: ?PreflightType,
  doFetchPreflight: FetchPreflightType,
  doStartPreflight: StartPreflightType,
}): React.Node => {
  if (!user) {
    // Require login first...
    return <LoginBtn label="Log In to Start Pre-Install Validation" />;
  }
  const hasValidToken = user.valid_token_for !== null;

  if (preflight === undefined) {
    // Fetch most recent preflight result (if any exists)
    doFetchPreflight(plan.id);
    return (
      <Button
        className={btnClasses}
        label={<LabelWithSpinner label="Loading..." />}
        variant="brand"
        disabled
      />
    );
  }

  if (preflight === null) {
    // No prior preflight exists
    if (hasValidToken) {
      return (
        <Button
          className={btnClasses}
          label="Start Pre-Install Validation"
          variant="brand"
          onClick={() => {
            doStartPreflight(plan.id);
          }}
        />
      );
    }
    // Require login first...
    return <LoginBtn label="Log In to Start Pre-Install Validation" />;
  }

  switch (preflight.status) {
    case 'started': {
      // Preflight in progress...
      return (
        <Button
          className={btnClasses}
          label={
            <LabelWithSpinner label="Pre-Install Validation In Progress" />
          }
          variant="brand"
          disabled
        />
      );
    }
    case 'complete': {
      if (preflight.is_valid && !preflight.has_errors) {
        if (hasValidToken) {
          // Preflight is done, valid, and has no errors -- allow installation
          return (
            <Button className={btnClasses} label="Install" variant="brand" />
          );
        }
        // Require login first...
        return <LoginBtn label="Log In to Install" />;
      }

      if (hasValidToken) {
        // Prior preflight exists, but is no longer valid or has errors
        return (
          <Button
            className={btnClasses}
            label="Re-Run Pre-Install Validation"
            variant="brand"
            onClick={() => {
              doStartPreflight(plan.id);
            }}
          />
        );
      }
      // Require login first...
      return <LoginBtn label="Log In to Re-Run Pre-Install Validation" />;
    }
    case 'failed': {
      if (hasValidToken) {
        // Prior preflight exists, but failed for unknown reason
        return (
          <Button
            className={btnClasses}
            label="Re-Run Pre-Install Validation"
            variant="brand"
            onClick={() => {
              doStartPreflight(plan.id);
            }}
          />
        );
      }
      // Require login first...
      return <LoginBtn label="Log In to Re-Run Pre-Install Validation" />;
    }
  }
  return null;
};

export default CtaButton;
