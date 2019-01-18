// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';

import { CONSTANTS } from 'plans/reducer';

const steps = [
  {
    id: 0,
    label: 'Log in',
  },
  {
    id: 1,
    label: 'Run pre-install validation',
  },
  {
    id: 2,
    label: 'Pre-install validation complete',
  },
];

const ProgressIndicator = ({
  userLoggedIn,
  preflightStatus,
  preflightIsReady,
}: {
  userLoggedIn?: boolean,
  preflightStatus?: ?string,
  preflightIsReady?: boolean,
}) => {
  let activeStep = 0;
  if (userLoggedIn) {
    activeStep = preflightStatus ? 2 : 1;
  }
  const completedSteps = preflightIsReady
    ? steps.slice()
    : steps.slice(0, activeStep);
  const errorSteps =
    userLoggedIn &&
    preflightStatus &&
    preflightStatus !== CONSTANTS.STATUS.STARTED &&
    !preflightIsReady
      ? steps.slice(activeStep, activeStep + 1)
      : [];
  const selectedStep = steps[activeStep];
  return (
    <SLDSProgressIndicator
      className="slds-m-top_medium"
      steps={steps}
      completedSteps={completedSteps}
      selectedStep={selectedStep}
      errorSteps={errorSteps}
    />
  );
};

export default ProgressIndicator;
