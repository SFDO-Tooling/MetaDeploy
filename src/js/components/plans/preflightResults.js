// @flow

import * as React from 'react';

import type { Preflight as PreflightType } from 'plans/reducer';

const PreflightResults = ({
  preflight,
}: {
  preflight: PreflightType,
}): React.Node => {
  if (preflight.status !== 'complete') {
    return null;
  }

  if (preflight.has_errors) {
    return (
      <p className="slds-text-color_error">
        Pre-install validation has completed with errors.
      </p>
    );
  }

  if (preflight.is_valid) {
    return (
      <p className="slds-text-color_success">
        Pre-install validation has completed successfully.
      </p>
    );
  }

  return <p>Your pre-install validation has expired; please run it again.</p>;
};

export default PreflightResults;
