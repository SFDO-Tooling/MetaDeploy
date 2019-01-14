// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';

import { CONSTANTS } from 'plans/reducer';

import type { Job as JobType } from 'jobs/reducer';
import type {
  Preflight as PreflightType,
  StepResult as StepResultType,
} from 'plans/reducer';

export const ErrorIcon = ({
  size,
  containerClassName,
}: {
  size?: string,
  containerClassName?: string,
}): React.Node => (
  <Icon
    assistiveText={{ label: 'Error' }}
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
    assistiveText={{ label: 'Warning' }}
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
  successMessage?: string,
}): React.Node => {
  const currentJob = job || preflight;
  if (
    !currentJob ||
    (currentJob.status !== CONSTANTS.STATUS.COMPLETE &&
      currentJob.status !== CONSTANTS.STATUS.FAILED)
  ) {
    return null;
  }

  const hasErrors =
    currentJob.error_count !== undefined && currentJob.error_count > 0;
  const hasWarnings =
    currentJob.warning_count !== undefined && currentJob.warning_count > 0;
  if (
    hasErrors ||
    hasWarnings ||
    currentJob.status === CONSTANTS.STATUS.FAILED
  ) {
    // Show errors/warnings
    const errorCount = currentJob.error_count || 0;
    const warningCount = currentJob.warning_count || 0;
    let msg = 'errors';
    const errorMsg = `${errorCount} error${errorCount === 1 ? '' : 's'}`;
    const warningMsg = `${warningCount} warning${
      warningCount === 1 ? '' : 's'
    }`;
    if (errorCount > 0 && warningCount > 0) {
      msg = `${errorMsg} and ${warningMsg}`;
    } else if (errorCount > 0) {
      msg = errorMsg;
    } else if (warningCount > 0) {
      msg = warningMsg;
    }
    const jobErrors = currentJob.results && currentJob.results.plan;
    const failed =
      errorCount > 0 || currentJob.status === CONSTANTS.STATUS.FAILED;
    return (
      <>
        <p className={failed ? 'slds-text-color_error' : ''}>
          {failed ? <ErrorIcon /> : <WarningIcon />}
          {/*
              Show "expired" message if job is not valid and has no errors.
              We check `is_valid === false` instead of simply `!is_valid`
              because jobs do not have `is_valid` property.
           */}
          {currentJob.is_valid === false && !failed
            ? `${label} has expired; please run it again.`
            : `${label} encountered ${msg}.`}
        </p>
        {failed && failMessage ? <p>{failMessage}</p> : null}
        {jobErrors ? <ErrorsList errorList={jobErrors} /> : null}
      </>
    );
  }

  // We check `is_valid === false` instead of simply `!is_valid` because jobs do
  // not have `is_valid` property.
  if (currentJob.is_valid === false) {
    return (
      <p>
        <WarningIcon />
        {label} has expired; please run it again.
      </p>
    );
  }

  // Successful job
  return (
    <>
      <p className="slds-text-color_success">{label} completed successfully.</p>
      {successMessage ? <p>{successMessage}</p> : null}
    </>
  );
};

export default JobResults;
