import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import * as React from 'react';
import { Trans } from 'react-i18next';

import { Job } from '@/store/jobs/reducer';
import { CONSTANTS, Preflight, StepResult } from '@/store/plans/reducer';

export const ErrorIcon = ({
  size,
  containerClassName,
}: {
  size?: string;
  containerClassName?: string;
}) => (
  <Icon
    assistiveText={{ label: i18n.t('Error') }}
    category="utility"
    name="error"
    colorVariant="error"
    size={size || 'x-small'}
    className="slds-m-bottom_xxx-small"
    containerClassName={containerClassName || 'slds-m-right_x-small'}
  />
);

export const WarningIcon = () => (
  <Icon
    assistiveText={{ label: i18n.t('Warning') }}
    category="utility"
    name="warning"
    colorVariant="warning"
    size="x-small"
    className="slds-m-bottom_xxx-small"
    containerClassName="slds-m-right_x-small"
  />
);

// Job "error" or "warning" message
export const JobError = ({ err }: { err: StepResult }) => {
  let node = null;

  /* istanbul ignore else */
  if (err.message) {
    switch (err.status) {
      case CONSTANTS.RESULT_STATUS.ERROR:
        node = (
          <li>
            <ErrorIcon />
            {/* These messages are pre-cleaned by the API */}
            <span
              className="slds-text-color_error"
              dangerouslySetInnerHTML={{ __html: err.message }}
            />
          </li>
        );
        break;
      case CONSTANTS.RESULT_STATUS.WARN:
        node = (
          <li>
            <WarningIcon />
            {/* These messages are pre-cleaned by the API */}
            <span dangerouslySetInnerHTML={{ __html: err.message }} />
          </li>
        );
        break;
    }
  }

  return <ul className="plan-error-list">{node}</ul>;
};

export const getErrorInfo = ({
  job,
  preflight,
  label,
}: {
  job?: Job;
  preflight?: Preflight;
  label: string;
}) => {
  const currentJob = job || preflight;
  const info: { failed: boolean; message: string | null } = {
    failed: false,
    message: null,
  };
  if (!currentJob) {
    return info;
  }
  const hasErrors =
    currentJob.error_count !== undefined && currentJob.error_count > 0;
  const hasWarnings =
    currentJob.warning_count !== undefined && currentJob.warning_count > 0;
  const canceledPreflight =
    preflight && currentJob.status === CONSTANTS.STATUS.CANCELED;
  if (
    hasErrors ||
    hasWarnings ||
    currentJob.status === CONSTANTS.STATUS.FAILED ||
    canceledPreflight
  ) {
    // Show errors/warnings
    const errorCount = currentJob.error_count || 0;
    const warningCount = currentJob.warning_count || 0;
    let msg = i18n.t('errors');
    const errorDefault = `${errorCount} error${errorCount === 1 ? '' : 's'}`;
    const warningDefault = `${warningCount} warning${
      warningCount === 1 ? '' : 's'
    }`;
    const errorMsg = i18n.t('errorMsg', errorDefault, {
      count: errorCount,
    });
    const warningMsg = i18n.t('warningMsg', warningDefault, {
      count: warningCount,
    });
    if (errorCount > 0 && warningCount > 0) {
      msg = `${errorMsg} ${i18n.t('and')} ${warningMsg}`;
    } else if (errorCount > 0) {
      msg = errorMsg;
    } else if (warningCount > 0) {
      msg = warningMsg;
    }
    const failed =
      errorCount > 0 ||
      currentJob.status === CONSTANTS.STATUS.FAILED ||
      canceledPreflight;
    info.failed = Boolean(failed);
    info.message =
      preflight && !(currentJob as Preflight).is_valid && !failed
        ? i18n.t(`${label} has expired; please run it again.`)
        : `${i18n.t(`${label} encountered`)} ${msg}.`;
  }
  return info;
};

const PreflightResults = ({ preflight }: { preflight: Preflight }) => {
  if (
    preflight.status !== CONSTANTS.STATUS.COMPLETE &&
    preflight.status !== CONSTANTS.STATUS.FAILED &&
    preflight.status !== CONSTANTS.STATUS.CANCELED
  ) {
    return null;
  }

  const { failed, message } = getErrorInfo({
    preflight,
    label: 'Pre-install validation', // Do not translate - used to construct string name
  });
  const planErrors = preflight.results?.plan;
  if (message !== null) {
    return (
      <>
        <p className={failed ? 'slds-text-color_error' : ''}>
          {failed ? <ErrorIcon /> : <WarningIcon />}
          {message}
        </p>
        {failed ? (
          <p>
            {i18n.t(
              'After resolving all errors, run the pre-install validation again.',
            )}
          </p>
        ) : null}
        {planErrors ? <JobError err={planErrors} /> : null}
      </>
    );
  }

  if (!preflight.is_valid) {
    return (
      <p>
        <WarningIcon />
        {i18n.t('Pre-install validation has expired; please run it again.')}
      </p>
    );
  }

  // Successful preflight
  const preflight_minutes = window.GLOBALS.PREFLIGHT_LIFETIME_MINUTES || 10;
  return (
    <>
      <p className="slds-text-color_success">
        {i18n.t('Pre-install validation completed successfully.')}
      </p>
      <p>
        <Trans i18nKey="preflightValidTime" count={preflight_minutes}>
          Pre-install validation will expire if install is not run within{' '}
          {{ preflight_minutes }} minutes, and you will need to run pre-install
          validation again.
        </Trans>
      </p>
    </>
  );
};

export default PreflightResults;
