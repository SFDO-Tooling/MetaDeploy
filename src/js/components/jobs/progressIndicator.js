// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';

import { CONSTANTS } from 'plans/reducer';
import { STEPS } from 'components/plans/progressIndicator';
import type { Job as JobType } from 'jobs/reducer';

const ProgressIndicator = ({ job }: { job: JobType }) => {
  const completedSteps =
    job.status === CONSTANTS.STATUS.COMPLETE
      ? STEPS.slice()
      : STEPS.slice(0, 3);
  const errorSteps =
    job.status === CONSTANTS.STATUS.FAILED ||
    job.status === CONSTANTS.STATUS.CANCELED
      ? STEPS.slice(3)
      : [];
  return (
    <SLDSProgressIndicator
      className="slds-m-top_medium"
      steps={STEPS}
      completedSteps={completedSteps}
      selectedStep={STEPS[3]}
      errorSteps={errorSteps}
    />
  );
};

export default ProgressIndicator;
