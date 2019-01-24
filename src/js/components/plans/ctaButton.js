// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';

import routes from 'utils/routes';
import { CONSTANTS } from 'plans/reducer';
import { getUrlParam, removeUrlParam } from 'utils/api';

import Login from 'components/header/login';
import PreflightWarningModal from 'components/plans/preflightWarningModal';

import type { RouterHistory } from 'react-router-dom';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
} from 'plans/reducer';
import type { SelectedSteps as SelectedStepsType } from 'components/plans/detail';
import type { UrlParams } from 'utils/api';
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

const { STATUS, AUTO_START_PREFLIGHT } = CONSTANTS;
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
  redirectParams,
}: {
  id?: string,
  label: string,
  redirectParams?: UrlParams,
}): React.Node => (
  <Login
    id={id || 'plan-detail-login'}
    buttonClassName={btnClasses}
    buttonVariant="brand"
    triggerClassName="slds-size_full"
    label={label}
    menuPosition="relative"
    nubbinPosition="top"
    redirectParams={redirectParams}
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

class CtaButton extends React.Component<
  Props,
  { modalOpen: boolean, startPreflight: boolean },
> {
  constructor(props: Props) {
    super(props);
    this.state = { modalOpen: false, startPreflight: false };
  }

  componentDidMount() {
    const startPreflight = getUrlParam(AUTO_START_PREFLIGHT);
    if (startPreflight === 'true') {
      const { history, preflight } = this.props;
      // `preflight === null`: no prior preflight exists
      // `preflight === undefined`: still fetching prior preflights
      // If we don't know about past preflights yet, wait until we do...
      if (preflight === undefined) {
        this.setState({ startPreflight: true });
      } else {
        this.autoStartPreflight();
      }
      // Remove query-string from URL
      history.replace({ search: removeUrlParam(AUTO_START_PREFLIGHT) });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { preflight } = this.props;
    const { startPreflight } = this.state;
    const preflightChanged = preflight !== prevProps.preflight;
    if (startPreflight && preflightChanged && preflight !== undefined) {
      this.autoStartPreflight();
    }
  }

  autoStartPreflight(): void {
    const { plan, doStartPreflight } = this.props;
    this.setState({ startPreflight: false });
    if (this.canStartPreflight()) {
      doStartPreflight(plan.id);
    }
  }

  canStartPreflight(): boolean {
    const { user, preflight, preventAction } = this.props;
    // We only want to auto-start a preflight if all of the following are true:
    //   - user is logged in, with a valid token
    //   - no other preflights/jobs are running on the current SF org
    //   - no prior preflight exists OR
    //     prior preflight exists, but was unsuccessful (not ready for install)
    return Boolean(
      user &&
        user.valid_token_for !== null &&
        !preventAction &&
        (preflight === null ||
          (preflight &&
            preflight.status !== STATUS.STARTED &&
            !preflight.is_ready)),
    );
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
  getLoginOrActionBtn(
    label: string,
    onClick: () => void,
    startPreflightAfterLogin?: boolean = false,
  ): React.Node {
    const { user, preventAction } = this.props;
    const hasValidToken = user && user.valid_token_for !== null;
    if (hasValidToken) {
      return (
        <ActionBtn label={label} onClick={onClick} disabled={preventAction} />
      );
    }
    // Require login first...
    return (
      <LoginBtn
        label={`Log In to ${label}`}
        redirectParams={
          startPreflightAfterLogin ? { [AUTO_START_PREFLIGHT]: true } : {}
        }
      />
    );
  }

  render(): React.Node {
    const { user, plan, preflight, doStartPreflight } = this.props;
    if (!user) {
      // Require login first...
      return (
        <LoginBtn
          label="Log In to Start Pre-Install Validation"
          redirectParams={{ [AUTO_START_PREFLIGHT]: true }}
        />
      );
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
        true,
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
          true,
        );
      }
      case STATUS.CANCELED:
      case STATUS.FAILED: {
        // Prior preflight exists, but failed or had plan-level errors
        return this.getLoginOrActionBtn(
          'Re-Run Pre-Install Validation',
          startPreflight,
          true,
        );
      }
    }
    return null;
  }
}

export default CtaButton;
