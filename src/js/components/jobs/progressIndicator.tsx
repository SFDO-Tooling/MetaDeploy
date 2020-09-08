import SLDSProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import i18n from 'i18next';
import * as React from 'react';

import { Job } from '@/store/jobs/reducer';
import { CONSTANTS } from '@/store/plans/reducer';

const getSteps = () => [
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
const ProgressIndicator = ({ job }: { job: Job }) => {
  const steps = getSteps();
  const completedSteps =
    job.status === CONSTANTS.STATUS.COMPLETE
      ? steps.slice()
      : steps.slice(0, -1);
  const errorSteps =
    job.status === CONSTANTS.STATUS.FAILED ||
    job.status === CONSTANTS.STATUS.CANCELED
      ? steps.slice(-1)
      : [];
  return (
    <SLDSProgressIndicator
      className="slds-m-top_medium"
      steps={steps}
      completedSteps={completedSteps}
      selectedStep={steps[steps.length - 1]}
      errorSteps={errorSteps}
    />
  );
};

export default ProgressIndicator;
