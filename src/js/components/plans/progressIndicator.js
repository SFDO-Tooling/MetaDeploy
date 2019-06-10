// @flow

import * as React from 'react';
import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import i18n from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';

export const getSteps = () => [
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
      activeStep = 2;
    }
  }
  const steps = getSteps();
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
