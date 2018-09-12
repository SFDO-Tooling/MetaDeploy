// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { logout } from 'accounts/actions';

import Login from 'components/header/login';
import Logout from 'components/header/logout';

import type { User } from 'accounts/reducer';

const Header = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: typeof logout,
}) => (
  <PageHeader
    className="global-header
      slds-p-horizontal_x-large
      slds-p-vertical_medium"
    title={
      <Link
        to={routes.home()}
        className="slds-page-header__title
          slds-text-heading_large
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
          className="slds-text-heading_small
            slds-p-right_large
            slds-text-link_reset
            slds-align-middle"
        >
          Products
        </Link>
        {user ? <Logout user={user} doLogout={doLogout} /> : <Login />}
      </div>
    }
    variant="objectHome"
  />
);

const selectUserState = (appState): User => appState.user;

const select = appState => ({
  user: selectUserState(appState),
});

const actions = {
  doLogout: logout,
};

export default connect(
  select,
  actions,
)(Header);
