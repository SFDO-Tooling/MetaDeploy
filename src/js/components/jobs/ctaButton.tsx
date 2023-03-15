import Icon from '@salesforce/design-system-react/components/icon';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ActionBtn, LabelWithSpinner } from '@/js/components/plans/ctaButton';
import { Job } from '@/js/store/jobs/reducer';
import { CONSTANTS } from '@/js/store/plans/reducer';

const { STATUS } = CONSTANTS;
const btnClasses = 'slds-button slds-button_brand slds-p-vertical_xx-small';

const CtaButton = ({
  job,
  isScratchOrg,
  linkToPlan,
  canceling,
  preflightRequired,
  openModal,
}: {
  job: Job;
  isScratchOrg: boolean;
  linkToPlan: string;
  canceling: boolean;
  preflightRequired: boolean;
  openModal: () => void;
}) => {
  const { t } = useTranslation();

  switch (job.status) {
    case STATUS.STARTED:
      return (
        <ActionBtn
          label={
            <LabelWithSpinner
              label={
                canceling
                  ? t('Canceling Installation…')
                  : t('Installation In Progress…')
              }
            />
          }
          disabled
        />
      );
    case STATUS.COMPLETE: {
      if (isScratchOrg) {
        return <ActionBtn label={t('View Scratch Org')} onClick={openModal} />;
      }
      if (job.instance_url) {
        return (
          <a
            href={job.instance_url}
            target="_blank"
            rel="noreferrer noopener"
            className={btnClasses}
          >
            {t('View Org')}
            <Icon
              containerClassName="slds-p-left_x-small"
              category="utility"
              name="new_window"
              assistiveText={{ label: t('New Window') }}
              size="x-small"
              inverse
            />
          </a>
        );
      }
      return null;
    }
    case STATUS.CANCELED:
    case STATUS.FAILED: {
      return (
        <Link to={linkToPlan} className={btnClasses}>
          {preflightRequired
            ? t('Return to Pre-Install Validation')
            : t('Return to Plan')}
        </Link>
      );
    }
  }
  return null;
};

export default CtaButton;
