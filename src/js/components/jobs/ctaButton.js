// @flow

import * as React from 'react';
import Icon from '@salesforce/design-system-react/components/icon';

import { CONSTANTS } from 'plans/reducer';

import { ActionBtn, LabelWithSpinner } from 'components/plans/ctaButton';

import type { Job as JobType } from 'jobs/reducer';

const { STATUS } = CONSTANTS;

const CtaButton = ({ job }: { job: JobType }): React.Node => {
  switch (job.status) {
    case STATUS.STARTED:
      return (
        <ActionBtn
          label={<LabelWithSpinner label="Installation In Progress..." />}
          disabled
        />
      );
    case STATUS.COMPLETE: {
      if (job.organization_url) {
        return (
          <a
            href={job.organization_url}
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
            View Org
          </a>
        );
      }
      return null;
    }
  }
  return null;
};

export default CtaButton;
