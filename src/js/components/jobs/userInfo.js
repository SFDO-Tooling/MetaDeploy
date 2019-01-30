// @flow

import * as React from 'react';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

import type { Job as JobType } from 'jobs/reducer';

const UserInfo = ({ job }: { job: JobType }): React.Node => {
  if ((job.creator && job.creator.username) || job.org_name || job.org_type) {
    return (
      <div
        className="slds-p-around_medium
          slds-size_1-of-1
          slds-medium-size_1-of-2"
      >
        <Card
          bodyClassName="slds-card__body_inner"
          heading={t('Salesforce Org Information')}
          icon={<Icon category="utility" name="user" />}
        >
          <ul>
            {job.creator && job.creator.username ? (
              <li>
                <Trans i18nKey="jobUserName">
                  <strong>User:</strong> {job.creator.username}
                </Trans>
              </li>
            ) : null}
            {job.org_name ? (
              <li>
                <Trans i18nKey="jobOrgName">
                  <strong>Org:</strong> {job.org_name}
                </Trans>
              </li>
            ) : null}
            {job.org_type ? (
              <li>
                <Trans i18nKey="jobOrgType">
                  <strong>Type:</strong> {job.org_type}
                </Trans>
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    );
  }
  return null;
};

export default UserInfo;
