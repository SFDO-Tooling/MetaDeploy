// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import type { Job as JobType } from 'store/jobs/reducer';
import type {
  Preflight as PreflightType,
  StepResult as StepResultType,
} from 'store/plans/reducer';

export const ErrorIcon = ({
  size,
  containerClassName,
}: {
  size?: string,
  containerClassName?: string,
}): React.Node => (
  <Icon
    assistiveText={{ label: t('Error') }}
    category="utility"
    name="error"
    colorVariant="error"
    size={size || 'x-small'}
    className="slds-m-bottom_xxx-small"
    containerClassName={containerClassName || 'slds-m-right_x-small'}
  />
);

export const WarningIcon = (): React.Node => (
  <Icon
    assistiveText={{ label: t('Warning') }}
    category="utility"
    name="warning"
    colorVariant="warning"
    size="x-small"
    className="slds-m-bottom_xxx-small"
    containerClassName="slds-m-right_x-small"
  />
);

// List of job "error" and "warning" messages
export const ErrorsList = ({
  errorList,
}: {
  errorList: Array<StepResultType>,
}): React.Node => (
  <ul className="plan-error-list">
    {errorList.map((err, idx) => {
      if (!err.message) {
        return null;
      }
      switch (err.status) {
        case CONSTANTS.RESULT_STATUS.ERROR:
          return (
            <li key={idx}>
              <ErrorIcon />
              {/* These messages are pre-cleaned by the API */}
              <span
                className="slds-text-color_error"
                dangerouslySetInnerHTML={{ __html: err.message }}
              />
            </li>
          );
        case CONSTANTS.RESULT_STATUS.WARN:
          return (
            <li key={idx}>
              <WarningIcon />
              {/* These messages are pre-cleaned by the API */}
              <span dangerouslySetInnerHTML={{ __html: err.message }} />
            </li>
          );
      }
      return null;
    })}
  </ul>
);

export const getErrorInfo = ({
  job,
  preflight,
  label,
}: {
  job?: JobType,
  preflight?: PreflightType,
  label: string,
}): {
  failed: boolean,
  message: React.Node | null,
} => {
  const currentJob = job || preflight;
  const info = {
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
    let msg = t('errors');
    const errorDefault = `${errorCount} error${errorCount === 1 ? '' : 's'}`;
    const warningDefault = `${warningCount} warning${
      warningCount === 1 ? '' : 's'
    }`;
    const errorMsg = t('errorMsg', errorDefault, {
      count: errorCount,
    });
    const warningMsg = t('warningMsg', warningDefault, {
      count: warningCount,
    });
    if (errorCount > 0 && warningCount > 0) {
      msg = `${errorMsg} ${t('and')} ${warningMsg}`;
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
      preflight && !currentJob.is_valid && !failed
        ? t(`${label} has expired; please run it again.`)
        : `${t(`${label} encountered`)} ${msg}.`;
  }
  return info;
};

const PreflightResults = ({
  preflight,
}: {
  preflight: PreflightType,
}): React.Node => {
  if (
    preflight.status !== CONSTANTS.STATUS.COMPLETE &&
    preflight.status !== CONSTANTS.STATUS.FAILED &&
    preflight.status !== CONSTANTS.STATUS.CANCELED
  ) {
    return null;
  }

  const { failed, message } = getErrorInfo({
    preflight,
    label: t('Pre-install validation'),
  });
  const planErrors = preflight.results && preflight.results.plan;
  if (message !== null) {
    return (
      <>
        <p className={failed ? 'slds-text-color_error' : ''}>
          {failed ? <ErrorIcon /> : <WarningIcon />}
          {message}
        </p>
        {failed ? (
          <p>
            {t(
              'After resolving all errors, run the pre-install validation again.',
            )}
          </p>
        ) : null}
        {planErrors ? <ErrorsList errorList={planErrors} /> : null}
      </>
    );
  }

  if (!preflight.is_valid) {
    return (
      <p>
        <WarningIcon />
        {t('Pre-install validation has expired; please run it again.')}
      </p>
    );
  }

  // Successful preflight
  const preflight_minutes = window.GLOBALS.PREFLIGHT_LIFETIME_MINUTES || 10;
  return (
    <>
      <p className="slds-text-color_success">
        {t('Pre-install validation completed successfully.')}
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
