// @flow

import * as React from 'react';
import GlobalHeader from '@salesforce/design-system-react/components/global-header';
import GlobalHeaderDropdown from '@salesforce/design-system-react/components/global-header/dropdown';
import GlobalHeaderProfile from '@salesforce/design-system-react/components/global-header/profile';
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

const Header = ({
  logoSrc,
  user,
  doLogout,
}: {
  logoSrc?: ?string,
  user: User,
  doLogout: typeof logout,
}) => (
  <GlobalHeader logoSrc={logoSrc}>
    {user && user.username ? (
      <GlobalHeaderProfile
        id="logout"
        options={[
          {
            label: 'Log Out',
            leftIcon: {
              name: 'logout',
              category: 'utility',
            },
          },
        ]}
        onSelect={doLogout}
      />
    ) : (
      <GlobalHeaderDropdown
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
          window.location.href = opt.href;
        }}
        label="Log In"
        buttonVariant="brand"
        iconVariant={null}
      />
    )}
  </GlobalHeader>
);

export default connect(
  select,
  actions,
)(Header);
