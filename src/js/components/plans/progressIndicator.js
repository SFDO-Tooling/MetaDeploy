// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import { t } from 'i18next';

import { CONSTANTS } from 'plans/reducer';

export const getSteps = (translate: string => string) => [
  {
    id: 0,
    label: translate('Log in'),
  },
  {
    id: 1,
    label: translate('Run pre-install validation'),
  },
  {
    id: 2,
    label: translate('Pre-install validation complete'),
  },
  {
    id: 3,
    label: translate('Install'),
  },
];

const ProgressIndicator = ({
  userLoggedIn,
  preflightStatus,
  preflightIsValid,
  preflightIsReady,
}: {
  userLoggedIn?: boolean,
  preflightStatus?: ?string,
  preflightIsValid?: boolean,
  preflightIsReady?: boolean,
}) => {
  let activeStep = 0;
  if (userLoggedIn) {
    activeStep = 1;
    if (preflightIsReady) {
      activeStep = 3;
    } else if (preflightIsValid) {
      activeStep = 2;
    }
  }
  const steps = getSteps(t);
  const completedSteps = steps.slice(0, activeStep);
  const errorSteps =
    userLoggedIn &&
    preflightIsValid &&
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
