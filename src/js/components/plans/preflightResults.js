// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';

import { CONSTANTS } from 'plans/reducer';

import type {
  Preflight as PreflightType,
  PreflightError as PreflightErrorType,
} from 'plans/reducer';

const ErrorIcon = (): React.Node => (
  <Icon
    assistiveText={{ label: 'Error' }}
    category="utility"
    name="error"
    colorVariant="error"
    size="x-small"
    className="slds-m-bottom_xxx-small"
    containerClassName="slds-m-right_x-small"
  />
);

const WarningIcon = (): React.Node => (
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

// List of preflight "error" and "warning" messages
export const ErrorsList = ({
  errorList,
}: {
  errorList: Array<PreflightErrorType>,
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

const PreflightResults = ({
  preflight,
}: {
  preflight: PreflightType,
}): React.Node => {
  if (
    preflight.status !== CONSTANTS.STATUS.COMPLETE &&
    preflight.status !== CONSTANTS.STATUS.FAILED
  ) {
    return null;
  }

  const hasErrors =
    preflight.error_count !== undefined && preflight.error_count > 0;
  const hasWarnings =
    preflight.warning_count !== undefined && preflight.warning_count > 0;
  if (
    hasErrors ||
    hasWarnings ||
    preflight.status === CONSTANTS.STATUS.FAILED
  ) {
    // Show errors/warnings
    const errorCount = preflight.error_count || 0;
    const warningCount = preflight.warning_count || 0;
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
    const planErrors = preflight.results && preflight.results.plan;
    const failed =
      errorCount > 0 || preflight.status === CONSTANTS.STATUS.FAILED;
    return (
      <>
        <p className={failed ? 'slds-text-color_error' : ''}>
          {failed ? <ErrorIcon /> : <WarningIcon />}
          {failed || preflight.is_valid
            ? `Pre-install validation found ${msg}.`
            : 'Pre-install validation has expired; please run it again.'}
        </p>
        {failed ? (
          <p>
            After resolving all errors, run the pre-install validation again.
          </p>
        ) : null}
        {planErrors ? <ErrorsList errorList={planErrors} /> : null}
      </>
    );
  }

  // Valid preflight without errors/warnings
  if (preflight.is_valid) {
    return (
      <p className="slds-text-color_success">
        Pre-install validation completed successfully.
      </p>
    );
  }

  // Invalid preflight
  return (
    <p>
      <WarningIcon />
      Pre-install validation has expired; please run it again.
    </p>
  );
};

export default PreflightResults;
