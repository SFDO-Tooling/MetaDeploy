// @flow

import * as React from 'react';
import ProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';

const InstallProgressIndicator = (): React.Node => {
  // TODO compute steps situation from the state?
  const steps = [
    {
      id: 0,
      label: <i>First</i>,
      assistiveText: 'This is custom text in the assistive text key',
    },
    {
      id: 1,
      label: <i>Second step</i>,
      assistiveText: 'This is custom text in the assistive text key',
    },
    {
      id: 2,
      label: <i>Third step</i>,
      assistiveText: 'This is custom text in the assistive text key',
    },
    {
      id: 3,
      label: <i>Another step</i>,
      assistiveText: 'This is custom text in the assistive text key',
    },
  ];
  const completedSteps = [];
  const selectedStep = steps[0];
  return (
    <ProgressIndicator
      steps={steps}
      completedSteps={completedSteps}
      selectedStep={selectedStep}
    />
  );
};

export default InstallProgressIndicator;
