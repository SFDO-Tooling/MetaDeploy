// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import type { RouterHistory } from 'react-router-dom';

import routes from 'utils/routes';
import { logout } from 'store/user/actions';
import { selectOrg } from 'store/org/selectors';
import { selectSocketState } from 'store/socket/selectors';
import { selectUserState } from 'store/user/selectors';
import CurrentJobAlert from 'components/jobs/currentJobAlert';
import Login from 'components/header/login';
import Logout from 'components/header/logout';
import OfflineAlert from 'components/offlineAlert';
import type { AppState } from 'store';
import type { Org as OrgType } from 'store/org/reducer';
import type { Socket } from 'store/socket/reducer';
import type { User } from 'store/user/reducer';

type Props = {
  user: User,
  socket: Socket,
  org: OrgType,
  history?: RouterHistory,
  jobId?: string,
  doLogout: typeof logout,
};

class Header extends React.Component<Props> {
  controls = () => {
    const { user, doLogout } = this.props;
    return user ? <Logout user={user} doLogout={doLogout} /> : <Login />;
  };

  render() {
    const { socket, org, history, jobId } = this.props;
    return (
      <>
        {socket ? null : <OfflineAlert />}
        {org && org.current_job && jobId !== org.current_job.id ? (
          <CurrentJobAlert currentJob={org.current_job} history={history} />
        ) : null}
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
              {window.GLOBALS.SITE && window.GLOBALS.SITE.product_logo ? (
                <img
                  className="site-logo"
                  src={window.GLOBALS.SITE.product_logo}
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
          onRenderControls={this.controls}
          variant="object-home"
        />
      </>
    );
  }
}

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
  org: selectOrg(appState),
});

const actions = {
  doLogout: logout,
};

const WrappedHeader: React.ComponentType<{}> = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
