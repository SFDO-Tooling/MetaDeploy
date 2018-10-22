// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';

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

export const PlanErrors = ({
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
        case 'error':
          return (
            <li key={idx}>
              <ErrorIcon />
              {/* @@@ Is this a good idea? */}
              <span
                className="slds-text-color_error"
                dangerouslySetInnerHTML={{ __html: err.message }}
              />
            </li>
          );
        case 'warning':
          return (
            <li key={idx}>
              <WarningIcon />
              {/* @@@ Is this a good idea? */}
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
  if (preflight.status !== 'complete') {
    return null;
  }

  if (preflight.has_errors) {
    let errorCount = 0;
    let warningCount = 0;
    if (preflight.results) {
      for (const key of Object.keys(preflight.results)) {
        if (Array.isArray(preflight.results[key])) {
          for (const err of preflight.results[key]) {
            switch (err.status) {
              case 'error':
                errorCount = errorCount + 1;
                break;
              case 'warning':
                warningCount = warningCount + 1;
                break;
            }
          }
        }
      }
    }
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
    return (
      <>
        <p className={errorCount > 0 ? 'slds-text-color_error' : ''}>
          {errorCount > 0 ? <ErrorIcon /> : <WarningIcon />}
          Pre-install validation has completed with {msg}.
        </p>
        {errorCount > 0 ? (
          <p>
            After resolving all errors, run the pre-install validation again.
          </p>
        ) : null}
        {preflight.results &&
        preflight.results.plan_errors &&
        preflight.results.plan_errors.length ? (
          <PlanErrors errorList={preflight.results.plan_errors} />
        ) : null}
      </>
    );
  }

  if (preflight.is_valid) {
    return (
      <p className="slds-text-color_success">
        Pre-install validation has completed successfully.
      </p>
    );
  }

  return (
    <p>
      <WarningIcon />
      Pre-install validation has expired; please run it again.
    </p>
  );
};

export default PreflightResults;
