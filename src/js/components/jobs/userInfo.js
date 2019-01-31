// @flow

import * as React from 'react';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import { t } from 'i18next';

import type { Job as JobType } from 'jobs/reducer';

const UserInfo = ({ job }: { job: JobType }): React.Node => {
  if ((job.creator && job.creator.username) || job.org_name || job.org_type) {
    const { username } = job.creator ? job.creator : {};
    const { org_name, org_type } = job;
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
            {username ? (
              <li>
                <strong>{t('User')}:</strong> {username}
              </li>
            ) : null}
            {org_name ? (
              <li>
                <strong>{t('Org')}:</strong> {org_name}
              </li>
            ) : null}
            {org_type ? (
              <li>
                <strong>{t('Type')}:</strong> {org_type}
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
