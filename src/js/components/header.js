// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { logout } from 'accounts/actions';

import type { User } from 'accounts/reducer';

const selectUserState = (appState): User => appState.user;

const select = appState => ({
  user: selectUserState(appState),
});

const actions = {
  doLogout: logout,
};

const Login = () => {
  if (!window.api_urls.salesforce_production_login) {
    window.console.error(
      'Login URL not found for salesforce_production provider.',
    );
  }
  if (!window.api_urls.salesforce_test_login) {
    window.console.error('Login URL not found for salesforce_test provider.');
  }
  return (
    <Dropdown
      id="login"
      options={[
        {
          label: 'Production or Developer Org',
          href:
            window.api_urls.salesforce_production_login &&
            window.api_urls.salesforce_production_login(),
          disabled: !window.api_urls.salesforce_production_login,
        },
        {
          label: 'Sandbox Org',
          href:
            window.api_urls.salesforce_test_login &&
            window.api_urls.salesforce_test_login(),
          disabled: !window.api_urls.salesforce_test_login,
        },
      ]}
      onSelect={opt => {
        /* istanbul ignore else */
        if (opt.href) {
          window.location.assign(opt.href);
        }
      }}
      label="Log In"
      buttonVariant="brand"
      menuPosition="relative"
      nubbinPosition="top right"
    />
  );
};

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
    className="page-header"
    title={
      <Link
        to={routes.home()}
        className="slds-page-header__title slds-text-heading_large
          slds-text-link_reset"
      >
        <span data-logo-bit="start">meta</span>
        <span data-logo-bit="end">deploy</span>
      </Link>
    }
    navRight={
      <div>
        <Link
          to={routes.product_list()}
          className="global-nav slds-text-heading_small slds-p-right_large
            slds-text-link_reset slds-align-middle"
        >
          Products
        </Link>
        {user && user.username ? (
          <Logout user={user} doLogout={doLogout} />
        ) : (
          <Login />
        )}
      </div>
    }
    variant="objectHome"
  />
);

export default connect(
  select,
  actions,
)(Header);
