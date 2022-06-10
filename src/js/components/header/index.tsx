import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import { find } from 'lodash';
import React, { Component, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';

import Errors from '@/js/components/apiErrors';
import Login from '@/js/components/header/login';
import Logout from '@/js/components/header/logout';
import CurrentJobAlert from '@/js/components/jobs/currentJobAlert';
import OfflineAlert from '@/js/components/offlineAlert';
import { AppState } from '@/js/store';
import { clearErrors, removeError } from '@/js/store/errors/actions';
import { selectErrors } from '@/js/store/errors/selectors';
import { selectOrgs } from '@/js/store/org/selectors';
import { selectSocketState } from '@/js/store/socket/selectors';
import { logout } from '@/js/store/user/actions';
import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

type Props = {
  history?: RouteComponentProps['history'];
  jobId?: string | null;
  hideLogin?: boolean;
};

const select = (appState: AppState) => ({
  user: selectUserState(appState),
  socket: selectSocketState(appState),
  orgs: selectOrgs(appState),
  errors: selectErrors(appState),
});

const actions = {
  doLogout: logout,
  doClearErrors: clearErrors,
  doRemoveError: removeError,
};

const connector = connect(select, actions);

type PropsFromRedux = ConnectedProps<typeof connector>;

class Header extends Component<Props & PropsFromRedux> {
  controls = () => {
    const { user, doLogout, hideLogin } = this.props;
    let header: ReactNode = null;
    if (user) {
      header = <Logout user={user} doLogout={doLogout} />;
    } else if (!hideLogin) {
      header = <Login />;
    }
    return <PageHeaderControl>{header}</PageHeaderControl>;
  };

  componentWillUnmount() {
    const { doClearErrors } = this.props;
    doClearErrors();
  }

  render() {
    const { socket, orgs, errors, history, jobId, doRemoveError } = this.props;
    const logoSrc = window.GLOBALS.SITE?.company_logo;
    const currentJob = find(
      orgs,
      (org) => org.current_job !== null,
    )?.current_job;

    return (
      <>
        {socket ? null : <OfflineAlert />}
        {currentJob && jobId !== currentJob.id ? (
          <CurrentJobAlert currentJob={currentJob} history={history} />
        ) : null}
        <Errors errors={errors} doRemoveError={doRemoveError} />
        <PageHeader
          className="global-header
            slds-p-horizontal_x-large
            slds-p-vertical_medium"
          title={
            <Link
              to={routes.home()}
              className="slds-text-heading_large slds-text-link_reset"
            >
              {logoSrc ? (
                <img
                  className="site-logo"
                  src={logoSrc}
                  alt={window.GLOBALS.SITE.company_name}
                  title={window.GLOBALS.SITE.company_name}
                />
              ) : null}
            </Link>
          }
          onRenderControls={this.controls}
        />
      </>
    );
  }
}

export default connector(Header);
