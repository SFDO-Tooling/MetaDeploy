import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import i18n from 'i18next';
import * as React from 'react';

import { CONSTANTS } from '@/store/plans/reducer';
import { SUPPORTED_ORGS, SupportedOrgs } from '@/utils/constants';

const ProgressIndicator = ({
  userLoggedIn,
  preflightStatus,
  preflightIsValid,
  preflightIsReady,
  supportedOrg,
}: {
  userLoggedIn?: boolean;
  preflightStatus?: string | null | undefined;
  preflightIsValid?: boolean;
  preflightIsReady?: boolean;
  supportedOrg?: SupportedOrgs;
}) => {
  let activeStep = 0;
  if (userLoggedIn) {
    activeStep = 1;
    if (preflightIsReady) {
      activeStep = 2;
    }
  }

  let initialLabel;
  switch (supportedOrg) {
    case SUPPORTED_ORGS.Scratch: {
      initialLabel = i18n.t('Create Scratch Org');
      break;
    }
    case SUPPORTED_ORGS.Both: {
      initialLabel = i18n.t('Log In or Create Scratch Org');
      break;
    }
    case SUPPORTED_ORGS.Persistent: {
      initialLabel = i18n.t('Log in');
      break;
    }
  }
  const steps = [
    {
      id: 0,
      label: initialLabel,
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
      supportedOrg={supportedOrg}
    />
  );
};

export default ProgressIndicator;
