// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';

import { CONSTANTS } from 'plans/reducer';

import i18n from 'i18next';

export const STEPS = [
  {
    id: 0,
    label: i18n.t('Log in'),
  },
  {
    id: 1,
    label: i18n.t('Run pre-install validation'),
  },
  {
    id: 2,
    label: i18n.t('Pre-install validation complete'),
  },
  {
    id: 3,
    label: i18n.t('Install'),
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
