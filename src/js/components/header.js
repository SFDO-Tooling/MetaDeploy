// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { connect } from 'react-redux';

import { logout } from 'accounts/actions';

import type { User } from 'accounts/reducer';

const selectUserState = (appState): User => appState.user;

const select = appState => ({
  user: selectUserState(appState),
});

const actions = {
  doLogout: logout,
};

const Login = () => (
  <Dropdown
    id="login"
    options={[
      {
        label: 'Production or Developer Org',
        href: window.URLS.salesforce_production_login(),
      },
      {
        label: 'Sandbox Org',
        href: window.URLS.salesforce_test_login(),
      },
    ]}
    onSelect={opt => {
      window.location.assign(opt.href);
    }}
    label="Log In"
    buttonVariant="brand"
    menuPosition="relative"
    nubbinPosition="top right"
  />
);

const Logout = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: typeof logout,
}) => (
  <Dropdown
    id="logout"
    options={[
      {
        label: user && user.username,
        type: 'header',
      },
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

const Header = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: typeof logout,
}) => (
  <PageHeader
    title={
      <div className="slds-page-header__title md-logo">
        <span data-logo-bit="start">meta</span>
        <span data-logo-bit="end">deploy</span>
      </div>
    }
    navRight={
      user && user.username ? (
        <div>
          <Logout user={user} doLogout={doLogout} />
        </div>
      ) : (
        <div>
          <Login />
        </div>
      )
    }
    variant="objectHome"
  />
);

export default connect(
  select,
  actions,
)(Header);
