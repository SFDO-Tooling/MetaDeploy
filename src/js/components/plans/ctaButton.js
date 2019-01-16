// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';

import routes from 'utils/routes';
import { CONSTANTS } from 'plans/reducer';

import Login from 'components/header/login';
import PreflightWarningModal from 'components/plans/preflightWarningModal';

import type { RouterHistory } from 'react-router-dom';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
} from 'plans/reducer';
import type { SelectedSteps as SelectedStepsType } from 'components/plans/detail';
import type { User as UserType } from 'user/reducer';
import typeof { startJob as StartJobType } from 'jobs/actions';
import typeof { startPreflight as StartPreflightType } from 'plans/actions';

type Props = {
  history: RouterHistory,
  user: UserType,
  productSlug: string,
  versionLabel: string,
  plan: PlanType,
  preflight: ?PreflightType,
  selectedSteps: SelectedStepsType,
  preventAction: boolean,
  doStartPreflight: StartPreflightType,
  doStartJob: StartJobType,
};

const { STATUS } = CONSTANTS;
const btnClasses = 'slds-size_full slds-p-vertical_xx-small';

// For use as a "loading" button label
export const LabelWithSpinner = ({
  label,
  variant,
  size,
}: {
  label: string,
  variant?: string,
  size?: string,
}): React.Node => (
  <>
    <span className="slds-is-relative slds-m-right_large">
      <Spinner variant={variant || 'inverse'} size={size || 'small'} />
    </span>
    {label}
  </>
);

// Generic "login" dropdown with custom label text
export const LoginBtn = ({
  id,
  label,
}: {
  id?: string,
  label: string,
}): React.Node => (
  <Login
    id={id || 'plan-detail-login'}
    buttonClassName={btnClasses}
    buttonVariant="brand"
    triggerClassName="slds-size_full"
    label={label}
    nubbinPosition="top"
  />
);

// Primary CTA button
export const ActionBtn = ({
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

class CtaButton extends React.Component<Props, { modalOpen: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { modalOpen: false };
  }

  toggleModal = (isOpen: boolean) => {
    this.setState({ modalOpen: isOpen });
  };

  startJob = () => {
    const {
      history,
      productSlug,
      versionLabel,
      plan,
      selectedSteps,
      doStartJob,
    } = this.props;
    doStartJob({ plan: plan.id, steps: [...selectedSteps] }).then(action => {
      const { type, payload } = action;
      if (type === 'JOB_STARTED' && payload && payload.id) {
        const url = routes.job_detail(
          productSlug,
          versionLabel,
          plan.slug,
          payload.id,
        );
        history.push(url);
      }
    });
  };

  // Returns an action btn if logged in with a valid token;
  // otherwise returns a login dropdown
  getLoginOrActionBtn(label: string, onClick?: () => void): React.Node {
    const { user, preventAction } = this.props;
    const hasValidToken = user && user.valid_token_for !== null;
    if (hasValidToken) {
      return (
        <ActionBtn label={label} onClick={onClick} disabled={preventAction} />
      );
    }
    // Require login first...
    return <LoginBtn label={`Log In to ${label}`} />;
  }

  render(): React.Node {
    const { user, plan, preflight, doStartPreflight } = this.props;
    if (!user) {
      // Require login first...
      return <LoginBtn label="Log In to Start Pre-Install Validation" />;
    }

    // An `undefined` preflight means we don't know whether a preflight exists
    if (preflight === undefined) {
      return (
        <ActionBtn label={<LabelWithSpinner label="Loading..." />} disabled />
      );
    }

    const startPreflight = () => {
      doStartPreflight(plan.id);
    };
    // A `null` preflight means we already fetched and no prior preflight exists
    if (preflight === null) {
      // No prior preflight exists
      return this.getLoginOrActionBtn(
        'Start Pre-Install Validation',
        startPreflight,
      );
    }

    switch (preflight.status) {
      case STATUS.STARTED: {
        // Preflight in progress...
        return (
          <ActionBtn
            label={
              <LabelWithSpinner label="Pre-Install Validation In Progress..." />
            }
            disabled
          />
        );
      }
      case STATUS.COMPLETE: {
        if (preflight.is_ready) {
          // Preflight is done, valid, and has no errors -- allow installation
          const hasWarnings =
            preflight.warning_count !== undefined &&
            preflight.warning_count > 0;
          if (hasWarnings) {
            // Warnings must be confirmed before proceeding
            const btn = this.getLoginOrActionBtn('Install', () => {
              this.toggleModal(true);
            });
            return (
              <>
                {btn}
                <PreflightWarningModal
                  isOpen={this.state.modalOpen}
                  toggleModal={this.toggleModal}
                  startJob={this.startJob}
                  results={preflight.results}
                  steps={plan.steps || []}
                />
              </>
            );
          }
          return this.getLoginOrActionBtn('Install', this.startJob);
        }
        // Prior preflight exists, but is no longer valid or has errors
        return this.getLoginOrActionBtn(
          'Re-Run Pre-Install Validation',
          startPreflight,
        );
      }
      case STATUS.FAILED: {
        // Prior preflight exists, but failed or had plan-level errors
        return this.getLoginOrActionBtn(
          'Re-Run Pre-Install Validation',
          startPreflight,
        );
      }
    }
    return null;
  }
}

export default CtaButton;
