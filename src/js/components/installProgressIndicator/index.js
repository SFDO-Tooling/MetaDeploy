// @flow

import * as React from 'react';
import ProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';

const steps = [
  {
    id: 0,
    label: <i>Log in</i>,
    assistiveText: "You're logged in.",
  },
  {
    id: 1,
    label: <i>Start preflight</i>,
    assistiveText: "You've started the preflight check.",
  },
  {
    id: 2,
    label: <i>Preflight finished</i>,
    assistiveText: 'The preflight check has completed.',
  },
];

const InstallProgressIndicator = ({
  activeStep,
  status,
}: {
  activeStep: number,
  status: ?string,
}) => {
  const completedSteps = steps.slice(0, activeStep);
  const errorSteps =
    status === 'completed' || status === 'started'
      ? []
      : steps.slice(activeStep, activeStep + 1);
  const selectedStep = steps[activeStep];
  return (
    <ProgressIndicator
      steps={steps}
      completedSteps={completedSteps}
      selectedStep={selectedStep}
      errorSteps={errorSteps}
    />
  );
};

export default InstallProgressIndicator;
