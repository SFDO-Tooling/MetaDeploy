import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import Login from '@/components/header/login';
import ClickThroughAgreementModal from '@/components/plans/clickThroughAgreementModal';
import { SelectedSteps } from '@/components/plans/detail';
import PreflightWarningModal from '@/components/plans/preflightWarningModal';
import SpinOrgModal from '@/components/scratchOrgs/spinOrgModal';
import { JobData, JobStarted } from '@/store/jobs/actions';
import { PreflightStarted } from '@/store/plans/actions';
import { CONSTANTS, Plan, Preflight, StepResult } from '@/store/plans/reducer';
import { ScratchOrgSpinning } from '@/store/scratchOrgs/actions';
import { ScratchOrg } from '@/store/scratchOrgs/reducer';
import { User } from '@/store/user/reducer';
import { getUrlParam, removeUrlParam, UrlParams } from '@/utils/api';
import { SCRATCH_ORG_STATUSES, SUPPORTED_ORGS } from '@/utils/constants';
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
  scratchOrg: ScratchOrg | null | undefined;
  preventAction: boolean;
  doStartPreflight: (planId: string) => Promise<PreflightStarted>;
  doStartJob: (data: JobData) => Promise<JobStarted>;
  doSpinScratchOrg: (
    planId: string,
    email: string,
  ) => Promise<ScratchOrgSpinning>;
};

const { AUTO_START_PREFLIGHT, RESULT_STATUS, STATUS } = CONSTANTS;
const btnClasses = 'slds-p-vertical_xx-small';

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
    triggerClassName="slds-button"
    buttonClassName={btnClasses}
    buttonVariant="brand"
    label={label}
    menuPosition="relative"
    nubbinPosition="top left"
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
    clickThroughModalOpen: boolean;
    spinOrgModalOpen: boolean;
    startPreflight: boolean;
  }
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      preflightModalOpen: false,
      clickThroughModalOpen: false,
      spinOrgModalOpen: false,
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
    this.setState({ clickThroughModalOpen: isOpen });
  };

  toggleSpinOrgModal = (isOpen: boolean) => {
    this.setState({ spinOrgModalOpen: isOpen });
  };

  openPreflightModal = () => {
    this.togglePreflightModal(true);
  };

  openClickThroughModal = () => {
    this.toggleClickThroughModal(true);
  };

  openSpinOrgModal = () => {
    this.toggleSpinOrgModal(true);
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

  spinOrg = (email: string) => {
    const { plan, doSpinScratchOrg } = this.props;
    doSpinScratchOrg(plan.id, email);
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
    const { clickThroughModalOpen } = this.state;
    return clickThroughAgreement ? (
      <ClickThroughAgreementModal
        isOpen={clickThroughModalOpen}
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

  getPersistentOrgCTA() {
    const {
      user,
      clickThroughAgreement,
      plan,
      preflight,
      selectedSteps,
    } = this.props;
    const { preflightModalOpen } = this.state;

    if (user && !user.org_type) {
      return (
        <LoginBtn
          id="org-not-allowed-login"
          label={i18n.t('Log in with a different org')}
        />
      );
    }

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

      if (preflight === null) {
        // A `null` preflight means we already fetched and
        // no prior preflight exists
        return this.getLoginOrActionBtn(
          i18n.t('Start Pre-Install Validation'),
          i18n.t('Log In to Start Pre-Install Validation'),
          this.startPreflight,
          true,
        );
      }

      switch (preflight?.status) {
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
                    isOpen={preflightModalOpen}
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
    }

    // No preflight required:
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

  getScratchOrgCTA() {
    const {
      clickThroughAgreement,
      plan,
      preflight,
      selectedSteps,
      scratchOrg,
      preventAction,
    } = this.props;
    const { spinOrgModalOpen } = this.state;

    if (scratchOrg?.status === SCRATCH_ORG_STATUSES.started) {
      // Scratch org is being created
      return (
        <ActionBtn
          label={<LabelWithSpinner label={i18n.t('Creating Scratch Org…')} />}
          disabled
        />
      );
    }

    if (scratchOrg?.status !== SCRATCH_ORG_STATUSES.complete) {
      // No existing (valid, done) scratch org
      return (
        <>
          <ActionBtn
            label={i18n.t('Create Scratch Org')}
            onClick={this.openSpinOrgModal}
            disabled={preventAction}
          />
          <SpinOrgModal
            isOpen={spinOrgModalOpen}
            clickThroughAgreement={clickThroughAgreement}
            toggleModal={this.toggleSpinOrgModal}
            doSpinOrg={this.spinOrg}
          />
        </>
      );
    }

    if (plan.requires_preflight) {
      if (preflight === null) {
        // A `null` preflight means we already fetched and
        // no prior preflight exists
        return (
          <ActionBtn
            label={i18n.t('Start Pre-Install Validation')}
            onClick={this.startPreflight}
            disabled={preventAction}
          />
        );
      }

      switch (preflight?.status) {
        case STATUS.COMPLETE: {
          // Preflight is done, valid, and has no errors -- allow installation
          if (preflight.is_ready) {
            const hasWarnings = this.warningsInSelectedSteps();
            // Warnings must be confirmed before proceeding
            const btn = hasWarnings ? (
              <ActionBtn
                label={i18n.t('View Warnings to Continue Installation')}
                onClick={this.openPreflightModal}
                disabled={preventAction}
              />
            ) : (
              <ActionBtn
                label={i18n.t('Install')}
                onClick={this.startJob}
                disabled={preventAction}
              />
            );
            return (
              <>
                {btn}
                {hasWarnings ? (
                  <PreflightWarningModal
                    isOpen={this.state.preflightModalOpen}
                    toggleModal={this.togglePreflightModal}
                    startJob={this.startJob}
                    results={preflight.results}
                    steps={/* istanbul ignore next */ plan.steps || []}
                    selectedSteps={selectedSteps}
                  />
                ) : null}
              </>
            );
          }
          // Prior preflight exists, but is no longer valid or has errors
          return (
            <ActionBtn
              label={i18n.t('Re-Run Pre-Install Validation')}
              onClick={this.startPreflight}
              disabled={preventAction}
            />
          );
        }
        case STATUS.CANCELED:
        case STATUS.FAILED: {
          // Prior preflight exists, but failed or had plan-level errors
          return (
            <ActionBtn
              label={i18n.t('Re-Run Pre-Install Validation')}
              onClick={this.startPreflight}
              disabled={preventAction}
            />
          );
        }
      }
    }

    // No preflight required:
    return (
      <ActionBtn
        label={i18n.t('Install')}
        onClick={this.startJob}
        disabled={preventAction}
      />
    );
  }

  render() {
    const { plan, preflight, scratchOrg } = this.props;
    const canLogin = plan.supported_orgs !== SUPPORTED_ORGS.Scratch;
    const canCreateOrg = Boolean(
      window.GLOBALS.DEVHUB_USERNAME &&
        plan.supported_orgs !== SUPPORTED_ORGS.Persistent,
    );

    if (canCreateOrg && scratchOrg === undefined) {
      // An `undefined` org means we don't know whether the org exists
      return (
        <ActionBtn
          label={<LabelWithSpinner label={i18n.t('Loading…')} />}
          disabled
        />
      );
    }

    if (plan.requires_preflight) {
      if (preflight === undefined) {
        // An `undefined` preflight means we don't know whether preflight exists
        return (
          <ActionBtn
            label={<LabelWithSpinner label={i18n.t('Loading…')} />}
            disabled
          />
        );
      }

      if (preflight?.status === STATUS.STARTED) {
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
    }

    return (
      <>
        {canLogin ? this.getPersistentOrgCTA() : null}
        {canCreateOrg ? this.getScratchOrgCTA() : null}
      </>
    );
  }
}

export default CtaButton;
