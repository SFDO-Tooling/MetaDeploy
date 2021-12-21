import Button from '@salesforce/design-system-react/components/button';
import Spinner from '@salesforce/design-system-react/components/spinner';
import { t } from 'i18next';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import Login from '@/js/components/header/login';
import ClickThroughAgreementModal from '@/js/components/plans/clickThroughAgreementModal';
import { SelectedSteps } from '@/js/components/plans/detail';
import PreflightWarningModal from '@/js/components/plans/preflightWarningModal';
import SpinOrgModal from '@/js/components/scratchOrgs/spinOrgModal';
import { JobData, JobStarted } from '@/js/store/jobs/actions';
import { FetchOrgJobsSucceeded } from '@/js/store/org/actions';
import { PreflightStarted } from '@/js/store/plans/actions';
import {
  CONSTANTS,
  Plan,
  Preflight,
  StepResult,
} from '@/js/store/plans/reducer';
import { ScratchOrgSpinning } from '@/js/store/scratchOrgs/actions';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';
import { User } from '@/js/store/user/reducer';
import { getUrlParam, removeUrlParam, UrlParams } from '@/js/utils/api';
import { SCRATCH_ORG_STATUSES, SUPPORTED_ORGS } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

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
  doLogout: () => Promise<FetchOrgJobsSucceeded>;
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
    flipped
    redirectParams={redirectParams}
  />
);

// Primary CTA button
export const ActionBtn = ({
  label,
  disabled,
  onClick,
  btnVariant,
  className,
}: {
  label: string | React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  btnVariant?: string;
  className?: string;
}) => (
  <Button
    className={className || btnClasses}
    label={label}
    variant={btnVariant || 'brand'}
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
      history.replace({ search: removeUrlParam(AUTO_START_PREFLIGHT) });
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
    const results: { [key: string]: StepResult[] } = {};
    if (preflight?.results) {
      Object.keys(preflight.results).forEach((stepId) => {
        for (const result of preflight.results[stepId]) {
          if (result?.status === CONSTANTS.RESULT_STATUS.HIDE) {
            results[stepId] = [result];
          }
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
        preflight.results[id].some(
          (result) => result.message && result.status === RESULT_STATUS.WARN,
        ),
    );
  }

  getPersistentOrgCTA() {
    const { user, clickThroughAgreement, plan, preflight, selectedSteps } =
      this.props;
    const { preflightModalOpen } = this.state;
    const usesBothOrgTypes = plan.supported_orgs === SUPPORTED_ORGS.Both;

    if (user && !user.org_type) {
      return (
        <LoginBtn
          id="org-not-allowed-login"
          label={t('Log In With a Different Org')}
        />
      );
    }

    if (plan.requires_preflight) {
      if (!user) {
        // Require login first...
        return (
          <LoginBtn
            label={
              usesBothOrgTypes
                ? t('Log In to Existing Org')
                : t('Log In to Start Pre-Install Validation')
            }
            redirectParams={{ [AUTO_START_PREFLIGHT]: true }}
          />
        );
      }

      if (preflight === null) {
        // A `null` preflight means we already fetched and
        // no prior preflight exists
        return this.getLoginOrActionBtn(
          t('Start Pre-Install Validation'),
          usesBothOrgTypes
            ? t('Log In to Existing Org')
            : t('Log In to Start Pre-Install Validation'),
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
                  t('View Warnings to Continue Installation'),
                  /* istanbul ignore next */ usesBothOrgTypes
                    ? t('Log In to Existing Org')
                    : t('Log In to Continue Installation'),
                  this.openPreflightModal,
                )
              : this.getLoginOrActionBtn(
                  t('Install'),
                  usesBothOrgTypes
                    ? t('Log In to Existing Org')
                    : t('Log In to Install'),
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
            t('Re-Run Pre-Install Validation'),
            usesBothOrgTypes
              ? t('Log In to Existing Org')
              : t('Log In to Re-Run Pre-Install Validation'),
            this.startPreflight,
            true,
          );
        }
        case STATUS.CANCELED:
        case STATUS.FAILED: {
          // Prior preflight exists, but failed or had plan-level errors
          return this.getLoginOrActionBtn(
            t('Re-Run Pre-Install Validation'),
            usesBothOrgTypes
              ? t('Log In to Existing Org')
              : t('Log In to Re-Run Pre-Install Validation'),
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
          t('Install'),
          /* istanbul ignore next */ usesBothOrgTypes
            ? t('Log In to Existing Org')
            : t('Log In to Install'),
          action,
        )}
        {this.getClickThroughAgreementModal()}
      </>
    );
  }

  getScratchOrgCTA() {
    const {
      user,
      clickThroughAgreement,
      plan,
      preflight,
      selectedSteps,
      scratchOrg,
      preventAction,
      doLogout,
    } = this.props;
    const { spinOrgModalOpen } = this.state;
    const usesBothOrgTypes = plan.supported_orgs === SUPPORTED_ORGS.Both;
    const hasValidScratchOrg =
      scratchOrg?.status === SCRATCH_ORG_STATUSES.started ||
      scratchOrg?.status === SCRATCH_ORG_STATUSES.complete;
    const btnVariant =
      usesBothOrgTypes && !hasValidScratchOrg ? 'outline-brand' : 'brand';

    if (scratchOrg?.status === SCRATCH_ORG_STATUSES.started) {
      // Scratch org is being created
      return (
        <ActionBtn
          label={<LabelWithSpinner label={t('Creating Scratch Org…')} />}
          disabled
          btnVariant={btnVariant}
        />
      );
    }

    if (scratchOrg?.status !== SCRATCH_ORG_STATUSES.complete) {
      // No existing (valid, done) scratch org
      if (user) {
        return (
          <ActionBtn
            label={t('Log Out to Create Scratch Org')}
            onClick={doLogout}
            btnVariant={btnVariant}
          />
        );
      }
      return (
        <>
          <ActionBtn
            label={t('Create Scratch Org')}
            onClick={this.openSpinOrgModal}
            disabled={preventAction}
            btnVariant={btnVariant}
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

    if (user) {
      return (
        <ActionBtn
          label={t('Log Out to Use Scratch Org')}
          onClick={doLogout}
          btnVariant={btnVariant}
        />
      );
    }

    if (plan.requires_preflight) {
      if (preflight === null) {
        // A `null` preflight means we already fetched and
        // no prior preflight exists
        return (
          <ActionBtn
            label={
              /* istanbul ignore next */ usesBothOrgTypes
                ? t('Start Pre-Install Validation on Scratch Org')
                : t('Start Pre-Install Validation')
            }
            onClick={this.startPreflight}
            disabled={preventAction}
            btnVariant={btnVariant}
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
                label={
                  /* istanbul ignore next */ usesBothOrgTypes
                    ? t('View Warnings to Continue Installation on Scratch Org')
                    : t('View Warnings to Continue Installation')
                }
                onClick={this.openPreflightModal}
                disabled={preventAction}
                btnVariant={btnVariant}
              />
            ) : (
              <ActionBtn
                label={
                  /* istanbul ignore next */ usesBothOrgTypes
                    ? t('Install on Scratch Org')
                    : t('Install')
                }
                onClick={this.startJob}
                disabled={preventAction}
                btnVariant={btnVariant}
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
              label={
                /* istanbul ignore next */ usesBothOrgTypes
                  ? t('Re-Run Pre-Install Validation on Scratch Org')
                  : t('Re-Run Pre-Install Validation')
              }
              onClick={this.startPreflight}
              disabled={preventAction}
              btnVariant={btnVariant}
            />
          );
        }
        case STATUS.CANCELED:
        case STATUS.FAILED: {
          // Prior preflight exists, but failed or had plan-level errors
          return (
            <ActionBtn
              label={
                /* istanbul ignore next */ usesBothOrgTypes
                  ? t('Re-Run Pre-Install Validation on Scratch Org')
                  : t('Re-Run Pre-Install Validation')
              }
              onClick={this.startPreflight}
              disabled={preventAction}
              btnVariant={btnVariant}
            />
          );
        }
      }
    }

    // No preflight required:
    return (
      <ActionBtn
        label={
          /* istanbul ignore next */ usesBothOrgTypes
            ? t('Install on Scratch Org')
            : t('Install')
        }
        onClick={this.startJob}
        disabled={preventAction}
        btnVariant={btnVariant}
      />
    );
  }

  render() {
    const { plan, preflight, scratchOrg } = this.props;
    const canUsePersistentOrg = plan.supported_orgs !== SUPPORTED_ORGS.Scratch;
    const canUseScratchOrg = Boolean(
      window.GLOBALS.SCRATCH_ORGS_AVAILABLE &&
        plan.supported_orgs !== SUPPORTED_ORGS.Persistent,
    );
    const hasValidScratchOrg =
      canUseScratchOrg &&
      (scratchOrg?.status === SCRATCH_ORG_STATUSES.started ||
        scratchOrg?.status === SCRATCH_ORG_STATUSES.complete);

    if (canUseScratchOrg && scratchOrg === undefined) {
      // An `undefined` org means we don't know whether the org exists
      return (
        <ActionBtn
          label={<LabelWithSpinner label={t('Loading…')} />}
          disabled
        />
      );
    }

    if (plan.requires_preflight) {
      if (preflight === undefined) {
        // An `undefined` preflight means we don't know whether preflight exists
        return (
          <ActionBtn
            label={<LabelWithSpinner label={t('Loading…')} />}
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
                label={t('Pre-Install Validation In Progress…')}
              />
            }
            disabled
          />
        );
      }
    }

    return (
      <>
        {canUsePersistentOrg && !hasValidScratchOrg
          ? this.getPersistentOrgCTA()
          : null}
        {canUseScratchOrg ? this.getScratchOrgCTA() : null}
      </>
    );
  }
}

export default CtaButton;
