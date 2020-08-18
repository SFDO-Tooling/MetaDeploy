import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import * as React from 'react';

import { ErrorIcon, getErrorInfo } from '@/components/plans/preflightResults';
import { Job } from '@/store/jobs/reducer';
import { CONSTANTS } from '@/store/plans/reducer';

const JobResults = ({
  job,
  openModal,
}: {
  job: Job;
  openModal: () => void;
}) => {
  if (
    job.status !== CONSTANTS.STATUS.COMPLETE &&
    job.status !== CONSTANTS.STATUS.FAILED &&
    job.status !== CONSTANTS.STATUS.CANCELED
  ) {
    return null;
  }

  const { message } = getErrorInfo({
    job,
    label: 'Installation', // Do not translate - used to construct string name
  });
  if (message !== null) {
    const title = i18n.t('View Installation Error Details & Link');
    return (
      <div
        className="slds-box
          slds-box_link
          slds-box_x-small
          slds-media
          slds-m-bottom_medium"
        onClick={openModal}
      >
        <div
          className="slds-media__figure
            slds-media__figure_fixed-width
            slds-align_absolute-center
            slds-m-left_xx-small"
        >
          <Icon
            assistiveText={{ label: i18n.t('Error') }}
            category="utility"
            name="error"
            colorVariant="error"
          />
        </div>
        <div className="slds-media__body slds-border_left slds-p-around_small">
          <h2
            className="slds-truncate
              slds-text-heading_small
              slds-text-color_error"
            title={title}
          >
            {title}
          </h2>
          <div className="slds-m-top_small">
            {message} {i18n.t('View steps to resolve and share link.')}
          </div>
        </div>
      </div>
    );
  }

  // Canceled job
  if (job.status === CONSTANTS.STATUS.CANCELED) {
    return (
      <p className="slds-text-color_error">
        <ErrorIcon />
        {i18n.t('Installation was canceled.')}
      </p>
    );
  }

  // Successful job
  return (
    <p className="slds-text-color_success">
      {i18n.t('Installation completed successfully.')}
    </p>
  );
};

export default JobResults;
