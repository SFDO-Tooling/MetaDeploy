import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import { t } from 'i18next';
import * as React from 'react';

import { CONSTANTS } from '@/js/store/plans/reducer';
import { SUPPORTED_ORGS, SupportedOrgs } from '@/js/utils/constants';

export const getSteps = (
  supportedOrgs: SupportedOrgs,
  preflightRequired: boolean,
) => {
  let initialLabel = t('Log in');
  switch (supportedOrgs) {
    case SUPPORTED_ORGS.Scratch: {
      initialLabel = t('Create Scratch Org');
      break;
    }
    case SUPPORTED_ORGS.Both: {
      initialLabel = t('Log In or Create Scratch Org');
      break;
    }
  }

  if (preflightRequired) {
    return [
      {
        id: 0,
        label: initialLabel,
      },
      {
        id: 1,
        label: t('Run pre-install validation'),
      },
      {
        id: 2,
        label: t('Install'),
      },
    ];
  }
  return [
    {
      id: 0,
      label: initialLabel,
    },
    {
      id: 1,
      label: t('Install'),
    },
  ];
};

const ProgressIndicator = ({
  userLoggedIn,
  scratchOrgCreated,
  preflightStatus,
  preflightIsValid,
  preflightIsReady,
  supportedOrgs,
  preflightRequired,
}: {
  userLoggedIn?: boolean;
  scratchOrgCreated?: boolean;
  preflightStatus?: string | null | undefined;
  preflightIsValid?: boolean;
  preflightIsReady?: boolean;
  supportedOrgs: SupportedOrgs;
  preflightRequired: boolean;
}) => {
  let activeStep = 0;
  let initialActionComplete = userLoggedIn;
  switch (supportedOrgs) {
    case SUPPORTED_ORGS.Scratch: {
      initialActionComplete = scratchOrgCreated;
      break;
    }
    case SUPPORTED_ORGS.Both: {
      initialActionComplete = userLoggedIn || scratchOrgCreated;
      break;
    }
  }
  if (initialActionComplete) {
    activeStep = 1;
    if (preflightRequired && preflightIsReady) {
      activeStep = 2;
    }
  }

  const steps = getSteps(supportedOrgs, preflightRequired);

  const completedSteps = steps.slice(0, activeStep);
  const errorSteps =
    initialActionComplete &&
    preflightRequired &&
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
