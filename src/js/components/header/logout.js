// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';

import type { User } from 'accounts/reducer';
import typeof { logout as LogoutType } from 'accounts/actions';

const Logout = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: LogoutType,
}): React.Node => (
  <Dropdown
    id="logout"
    options={[
      {
        label: user && user.username,
        type: 'header',
      },
      { type: 'divider' },
      {
        label: 'Log Out',
        leftIcon: {
          name: 'logout',
          category: 'utility',
        },
      },
    ]}
    onSelect={doLogout}
    menuPosition="relative"
    nubbinPosition="top right"
  >
    <DropdownTrigger>
      <Button variant="icon">
        <Avatar />
      </Button>
    </DropdownTrigger>
  </Dropdown>
);

export default Logout;
