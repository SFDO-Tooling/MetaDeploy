import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import Login from '@/components/header/login';
import ClickThroughAgreementModal from '@/components/plans/clickThroughAgreementModal';
import { SelectedSteps } from '@/components/plans/detail';
import PreflightWarningModal from '@/components/plans/preflightWarningModal';
import { JobData, JobStarted } from '@/store/jobs/actions';
import { PreflightStarted } from '@/store/plans/actions';
import { CONSTANTS, Plan, Preflight, StepResult } from '@/store/plans/reducer';
import { User } from '@/store/user/reducer';
import { getUrlParam, removeUrlParam, UrlParams } from '@/utils/api';
import routes from '@/utils/routes';

type Props = {
  history: RouteComponentProps['history'];
  user: User;
  productSlug: string;
  clickThroughAgreement: string | null;
  versionLabel: string;
  plan: Plan;
  preflight: Preflight | null | undefined;
  selectedSteps: SelectedSteps;
  preventAction: boolean;
  doStartPreflight: (planId: string) => Promise<PreflightStarted>;
  doStartJob: (data: JobData) => Promise<JobStarted>;
};

const { AUTO_START_PREFLIGHT, RESULT_STATUS, STATUS } = CONSTANTS;
const btnClasses = 'slds-size_full slds-p-vertical_xx-small';

// For use as a "loading" button label
export const LabelWithSpinner = ({
  label,
  variant,
  size,
}: {
  label: string;
  variant?: string;
  size?: string;
}) => (
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
  id?: string;
  label: string;
  redirectParams?: UrlParams;
}) => (
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
  label: string | React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) => (
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
  {
    preflightModalOpen: boolean;
    clickThroughModal: boolean;
    startPreflight: boolean;
  }
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      preflightModalOpen: false,
      clickThroughModal: false,
      startPreflight: false,
    };
  }

  componentDidMount() {
    const startPreflight = getUrlParam(AUTO_START_PREFLIGHT);
    if (startPreflight === 'true') {
      const { history, preflight, plan } = this.props;
      // Remove query-string from URL
      history.push({ search: removeUrlParam(AUTO_START_PREFLIGHT) });
      // Bail if no preflight is required
      if (!plan.requires_preflight) {
        return;
      }
      // `preflight === null`: no prior preflight exists
      // `preflight === undefined`: still fetching prior preflights
      // If we don't know about past preflights yet, wait until we do...
      if (preflight === undefined) {
        this.setState({ startPreflight: true });
      } else {
        this.autoStartPreflight();
      }
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
      user?.valid_token_for &&
        !preventAction &&
        (preflight === null ||
          (preflight &&
            preflight.status !== STATUS.STARTED &&
            !preflight.is_ready)),
    );
  }

  togglePreflightModal = (isOpen: boolean) => {
    this.setState({ preflightModalOpen: isOpen });
  };

  toggleClickThroughModal = (isOpen: boolean) => {
    this.setState({ clickThroughModal: isOpen });
  };

  openPreflightModal = () => {
    this.togglePreflightModal(true);
  };

  openClickThroughModal = () => {
    this.toggleClickThroughModal(true);
  };

  startPreflight = () => {
    const { plan, doStartPreflight } = this.props;
    doStartPreflight(plan.id);
  };

  startJob = () => {
    const {
      history,
      productSlug,
      versionLabel,
      preflight,
      plan,
      selectedSteps,
      doStartJob,
    } = this.props;
    // propagate hidden steps from the preflight results to the job results
    const results: { [key: string]: StepResult } = {};
    if (preflight?.results) {
      Object.keys(preflight.results).forEach((id) => {
        const result = preflight.results[id];
        if (result?.status === CONSTANTS.RESULT_STATUS.HIDE) {
          results[id] = result;
        }
      });
    }
    doStartJob({ plan: plan.id, steps: [...selectedSteps], results }).then(
      (action) => {
        const { type, payload } = action;
        if (type === 'JOB_STARTED' && payload?.id) {
          const url = routes.job_detail(
            productSlug,
            versionLabel,
            plan.slug,
            payload.id,
          );
          history.push(url);
        }
      },
    );
  };

  // Returns an action btn if logged in with a valid token;
  // otherwise returns a login dropdown
  getLoginOrActionBtn(
    actionLabel: string,
    loginLabel: string,
    onClick: () => void,
    startPreflightAfterLogin = false,
  ) {
    const { user, preventAction } = this.props;
    const hasValidToken = Boolean(user?.valid_token_for);
    if (hasValidToken) {
      return (
        <ActionBtn
          label={actionLabel}
          onClick={onClick}
          disabled={preventAction}
        />
      );
    }
    // Require login first...
    return (
      <LoginBtn
        label={loginLabel}
        redirectParams={
          startPreflightAfterLogin ? { [AUTO_START_PREFLIGHT]: true } : {}
        }
      />
    );
  }

  getClickThroughAgreementModal() {
    const { clickThroughAgreement } = this.props;
    const { clickThroughModal } = this.state;
    return clickThroughAgreement ? (
      <ClickThroughAgreementModal
        isOpen={clickThroughModal}
        text={clickThroughAgreement}
        toggleModal={this.toggleClickThroughModal}
        startJob={this.startJob}
      />
    ) : null;
  }

  warningsInSelectedSteps(): boolean {
    const { selectedSteps, preflight } = this.props;

    /* istanbul ignore if */
    if (!preflight?.results) {
      return false;
    }
    return [...selectedSteps].some(
      (id) =>
        preflight.results[id] &&
        preflight.results[id].message &&
        preflight.results[id].status === RESULT_STATUS.WARN,
    );
  }

  render() {
    const {
      user,
      clickThroughAgreement,
      plan,
      preflight,
      selectedSteps,
    } = this.props;
    if (plan.requires_preflight) {
      if (!user) {
        // Require login first...
        return (
          <LoginBtn
            label={i18n.t('Log In to Start Pre-Install Validation')}
            redirectParams={{ [AUTO_START_PREFLIGHT]: true }}
          />
        );
      }

      // An `undefined` preflight means we don't know whether a preflight exists
      if (preflight === undefined) {
        return (
          <ActionBtn
            label={<LabelWithSpinner label={i18n.t('Loading…')} />}
            disabled
          />
        );
      }

      // A `null` preflight means we already fetched and no prior preflight exists
      if (preflight === null) {
        // No prior preflight exists
        return this.getLoginOrActionBtn(
          i18n.t('Start Pre-Install Validation'),
          i18n.t('Log In to Start Pre-Install Validation'),
          this.startPreflight,
          true,
        );
      }

      switch (preflight.status) {
        case STATUS.STARTED: {
          // Preflight in progress...
          return (
            <ActionBtn
              label={
                <LabelWithSpinner
                  label={i18n.t('Pre-Install Validation In Progress…')}
                />
              }
              disabled
            />
          );
        }
        case STATUS.COMPLETE: {
          // Preflight is done, valid, and has no errors -- allow installation
          if (preflight.is_ready) {
            const hasWarnings = this.warningsInSelectedSteps();
            // Terms must be confirmed before proceeding
            const action = clickThroughAgreement
              ? this.openClickThroughModal
              : this.startJob;
            // Warnings must be confirmed before proceeding
            const btn = hasWarnings
              ? this.getLoginOrActionBtn(
                  i18n.t('View Warnings to Continue Installation'),
                  i18n.t('View Warnings to Continue Installation'),
                  this.openPreflightModal,
                )
              : this.getLoginOrActionBtn(
                  i18n.t('Install'),
                  i18n.t('Log In to Install'),
                  action,
                );
            return (
              <>
                {btn}
                {hasWarnings ? (
                  <PreflightWarningModal
                    isOpen={this.state.preflightModalOpen}
                    toggleModal={this.togglePreflightModal}
                    startJob={action}
                    results={preflight.results}
                    steps={plan.steps || []}
                    selectedSteps={selectedSteps}
                  />
                ) : null}
                {this.getClickThroughAgreementModal()}
              </>
            );
          }
          // Prior preflight exists, but is no longer valid or has errors
          return this.getLoginOrActionBtn(
            i18n.t('Re-Run Pre-Install Validation'),
            i18n.t('Log In to Re-Run Pre-Install Validation'),
            this.startPreflight,
            true,
          );
        }
        case STATUS.CANCELED:
        case STATUS.FAILED: {
          // Prior preflight exists, but failed or had plan-level errors
          return this.getLoginOrActionBtn(
            i18n.t('Re-Run Pre-Install Validation'),
            i18n.t('Log In to Re-Run Pre-Install Validation'),
            this.startPreflight,
            true,
          );
        }
      }
      return null;
    }

    // Terms must be confirmed before proceeding
    const action = clickThroughAgreement
      ? this.openClickThroughModal
      : this.startJob;
    return (
      <>
        {this.getLoginOrActionBtn(
          i18n.t('Install'),
          i18n.t('Log In to Install'),
          action,
        )}
        {this.getClickThroughAgreementModal()}
      </>
    );
  }
}

export default CtaButton;
