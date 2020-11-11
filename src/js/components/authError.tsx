import i18n from 'i18next';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { connect } from 'react-redux';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import { EmptyIllustration } from '@/components/404';
import Header from '@/components/header';
import Login from '@/components/header/login';
import { AppState } from '@/store';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

const AuthError = withRouter(
  ({ user, history }: { user: User } & RouteComponentProps) => {
    const message = (window.JS_CONTEXT || {}).error_message || (
      <Trans i18nKey="errorWithAccount">
        An error occurred with your account. Try the{' '}
        <Link to={routes.home()}>home page</Link>?
      </Trans>
    );

    return (
      <DocumentTitle
        title={`${i18n.t('Authentication Error')} | ${window.SITE_NAME}`}
      >
        <>
          <Header history={history} />
          <EmptyIllustration message={message} />
          <div className="slds-align_absolute-center">
            <Login
              id="auth-error-login"
              label={
                user ? i18n.t('Log In With a Different Org') : i18n.t('Log In')
              }
              buttonClassName="slds-p-horizontal_xxx-small"
              buttonVariant="base"
            />
          </div>
        </>
      </DocumentTitle>
    );
  },
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const WrappedAuthError = connect(select)(AuthError);

export default WrappedAuthError;
