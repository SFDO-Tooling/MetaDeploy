// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import type { RouterHistory } from 'react-router-dom';

import routes from 'utils/routes';
import { clearErrors, removeError } from 'store/errors/actions';
import { logout } from 'store/user/actions';
import { selectErrors } from 'store/errors/selectors';
import { selectOrg } from 'store/org/selectors';
import { selectSocketState } from 'store/socket/selectors';
import { selectUserState } from 'store/user/selectors';
import CurrentJobAlert from 'components/jobs/currentJobAlert';
import Errors from 'components/apiErrors';
import Login from 'components/header/login';
import Logout from 'components/header/logout';
import OfflineAlert from 'components/offlineAlert';
import type { AppState } from 'store';
import type { ErrorType } from 'store/errors/reducer';
import type { Org as OrgType } from 'store/org/reducer';
import type { Socket } from 'store/socket/reducer';
import type { User } from 'store/user/reducer';

type Props = {
  user: User,
  socket: Socket,
  org: OrgType,
  errors: Array<ErrorType>,
  history?: RouterHistory,
  jobId?: string,
  doLogout: typeof logout,
  doClearErrors: typeof clearErrors,
  doRemoveError: typeof removeError,
};

class Header extends React.Component<Props> {
  controls = () => {
    const { user, doLogout } = this.props;
    return (
      <PageHeaderControl>
        {user ? <Logout user={user} doLogout={doLogout} /> : <Login />}
      </PageHeaderControl>
    );
  };

  componentWillUnmount() {
    const { doClearErrors } = this.props;
    doClearErrors();
  }

  render() {
    const { socket, org, errors, history, jobId, doRemoveError } = this.props;
    return (
      <>
        {socket ? null : <OfflineAlert />}
        {org && org.current_job && jobId !== org.current_job.id ? (
          <CurrentJobAlert currentJob={org.current_job} history={history} />
        ) : null}
        <Errors errors={errors} doRemoveError={doRemoveError} />
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
        />
      </>
    );
  }
}

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
  org: selectOrg(appState),
  errors: selectErrors(appState),
});

const actions = {
  doLogout: logout,
  doClearErrors: clearErrors,
  doRemoveError: removeError,
};

const WrappedHeader: React.ComponentType<{}> = connect(
  select,
  actions,
)(Header);

export default WrappedHeader;
