// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import { t } from 'i18next';

import { CONSTANTS } from 'plans/reducer';

export const STEPS = [
  {
    id: 0,
    label: t('Log in'),
  },
  {
    id: 1,
    label: t('Run pre-install validation'),
  },
  {
    id: 2,
    label: t('Pre-install validation complete'),
  },
  {
    id: 3,
    label: t('Install'),
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
  const completedSteps = STEPS.slice(0, activeStep);
  const errorSteps =
    userLoggedIn &&
    preflightIsValid &&
    preflightStatus !== CONSTANTS.STATUS.STARTED &&
    !preflightIsReady
      ? STEPS.slice(activeStep, activeStep + 1)
      : [];
  const selectedStep = STEPS[activeStep];
  return (
    <SLDSProgressIndicator
      className="slds-m-top_medium"
      steps={STEPS}
      completedSteps={completedSteps}
      selectedStep={selectedStep}
      errorSteps={errorSteps}
    />
  );
};

export default ProgressIndicator;
