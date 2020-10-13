import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { ActionBtn, LabelWithSpinner } from '@/components/plans/ctaButton';
import { Job } from '@/store/jobs/reducer';
import { CONSTANTS } from '@/store/plans/reducer';

const { STATUS } = CONSTANTS;

const CtaButton = ({
  job,
  linkToPlan,
  canceling,
  preflightRequired,
}: {
  job: Job;
  linkToPlan: string;
  canceling: boolean;
  preflightRequired: boolean;
}) => {
  switch (job.status) {
    case STATUS.STARTED:
      return (
        <ActionBtn
          label={
            <LabelWithSpinner
              label={
                canceling
                  ? i18n.t('Canceling Installation…')
                  : i18n.t('Installation In Progress…')
              }
            />
          }
          disabled
        />
      );
    case STATUS.COMPLETE: {
      if (job.organization_url) {
        return (
          <a
            href={job.organization_url}
            target="_blank"
            rel="noreferrer noopener"
            className="slds-button
              slds-button_brand
              slds-size_full
              slds-p-vertical_xx-small"
          >
            <Icon
              containerClassName="slds-p-right_x-small"
              category="utility"
              name="new_window"
              size="x-small"
              inverse
            />
            {i18n.t('View Org')}
          </a>
        );
      }
      return null;
    }
    case STATUS.CANCELED:
    case STATUS.FAILED: {
      return (
        <Link
          to={linkToPlan}
          className="slds-button
            slds-button_brand
            slds-size_full
            slds-p-vertical_xx-small"
        >
          {preflightRequired
            ? i18n.t('Return to Pre-Install Validation')
            : i18n.t('Return to Plan')}
        </Link>
      );
    }
  }
  return null;
};

export default CtaButton;
