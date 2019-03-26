// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';
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
  errorList: StepResultType,
}): React.Node => {
  const err = errorList;
  let node = null;
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

  return <ul className="plan-error-list">{node}</ul>;
};

const JobResults = ({
  job,
  preflight,
  label,
  failMessage,
  successMessage,
}: {
  job?: JobType,
  preflight?: PreflightType,
  label: string,
  failMessage?: string,
  successMessage?: React.Node,
}): React.Node => {
  const currentJob = job || preflight;
  if (
    !currentJob ||
    (currentJob.status !== CONSTANTS.STATUS.COMPLETE &&
      currentJob.status !== CONSTANTS.STATUS.FAILED &&
      currentJob.status !== CONSTANTS.STATUS.CANCELED)
  ) {
    return null;
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
    const jobErrors = currentJob.results && currentJob.results.plan;
    const failed =
      errorCount > 0 ||
      currentJob.status === CONSTANTS.STATUS.FAILED ||
      canceledPreflight;
    return (
      <>
        <p className={failed ? 'slds-text-color_error' : ''}>
          {failed ? <ErrorIcon /> : <WarningIcon />}
          {/*
              Show "expired" message if job is not valid and has no errors.
              We check `is_valid === false` instead of simply `!is_valid`
              because jobs do not have `is_valid` property.
           */}
          {currentJob.is_valid === false && !failed ? (
            t(`${label} has expired; please run it again.`)
          ) : (
            <>
              {t(`${label} encountered`)} {msg}.
            </>
          )}
        </p>
        {failed && failMessage ? <p>{failMessage}</p> : null}
        {jobErrors ? <ErrorsList errorList={jobErrors} /> : null}
      </>
    );
  }

  // Canceled job
  if (currentJob.status === CONSTANTS.STATUS.CANCELED) {
    return (
      <p className="slds-text-color_error">
        <ErrorIcon />
        {t(`${label} was canceled.`)}
      </p>
    );
  }

  // We check `is_valid === false` instead of simply `!is_valid` because jobs do
  // not have `is_valid` property.
  if (currentJob.is_valid === false) {
    return (
      <p>
        <WarningIcon />
        {t(`${label} has expired; please run it again.`)}
      </p>
    );
  }

  // Successful job
  return (
    <>
      <p className="slds-text-color_success">
        {t(`${label} completed successfully.`)}
      </p>
      {successMessage === undefined ? null : <p>{successMessage}</p>}
    </>
  );
};

export default JobResults;
