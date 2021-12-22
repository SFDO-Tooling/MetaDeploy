import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';
import UNSAFE_DirectionSettings from '@salesforce/design-system-react/components/utilities/UNSAFE_direction';
import { t } from 'i18next';
import * as React from 'react';

import { FetchOrgJobsSucceeded } from '@/js/store/org/actions';
import { User } from '@/js/store/user/reducer';

const Logout = ({
  user,
  doLogout,
}: {
  user: User;
  doLogout: () => Promise<FetchOrgJobsSucceeded>;
}) => (
  <UNSAFE_DirectionSettings.Consumer>
    {(direction: string) => {
      /* istanbul ignore next */
      const nubbinPosition = direction === 'ltr' ? 'top right' : 'top left';
      return (
        <Dropdown
          id="logout"
          options={[
            {
              label: user?.username,
              type: 'header',
            },
            { type: 'divider' },
            {
              label: t('Log Out'),
              leftIcon: {
                name: 'logout',
                category: 'utility',
              },
            },
          ]}
          onSelect={doLogout}
          menuPosition="relative"
          nubbinPosition={nubbinPosition}
        >
          <DropdownTrigger>
            <Button variant="icon">
              <Avatar />
            </Button>
          </DropdownTrigger>
        </Dropdown>
      );
    }}
  </UNSAFE_DirectionSettings.Consumer>
);

export default Logout;
