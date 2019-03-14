// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { logout } from 'store/user/actions';
import { selectSocketState } from 'store/socket/selectors';
import { selectUserState } from 'store/user/selectors';
import Login from 'components/header/login';
import Logout from 'components/header/logout';
import OfflineAlert from 'components/offlineAlert';
import type { AppState } from 'store';
import type { Socket } from 'store/socket/reducer';
import type { User } from 'store/user/reducer';

type Props = {
  user: User,
  doLogout: typeof logout,
  socket: Socket,
};

const Header = ({ user, doLogout, socket }: Props) => (
  <>
    {socket ? null : <OfflineAlert />}
    <PageHeader
      className="global-header
        slds-p-horizontal_x-large
        slds-p-vertical_medium"
      title={
        <Link
          to={routes.home()}
          className="slds-text-heading_large
            slds-text-link_reset"
        >
          {window.GLOBALS.SITE && window.GLOBALS.SITE.logo ? (
            <img
              className="slds-size_small"
              src={window.GLOBALS.SITE.logo}
              alt={window.SITE_NAME}
              title={window.SITE_NAME}
            />
          ) : (
            <>
              <span data-logo-bit="start">meta</span>
              <span data-logo-bit="end">deploy</span>
            </>
          )}
        </Link>
      }
      navRight={
        <>{user ? <Logout user={user} doLogout={doLogout} /> : <Login />}</>
      }
      variant="objectHome"
    />
  </>
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
});

const actions = {
  doLogout: logout,
};

const WrappedHeader: React.ComponentType<{}> = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
