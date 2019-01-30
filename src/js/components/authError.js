// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import i18n from 'i18n';
import { Trans } from 'react-i18next';

import routes from 'utils/routes';
import { selectUserState } from 'user/selectors';

import Login from 'components/header/login';
import { EmptyIllustration } from 'components/404';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type { User as UserType } from 'user/reducer';

const AuthError = ({ user }: { user: UserType }) => (
  <DocumentTitle title={i18n.t('Authentication Error | MetaDeploy')}>
    <>
      <EmptyIllustration
        message={
          <Trans i18nKey="errorWithAccount">
            An error occurred with your account. Try the{' '}
            <Link to={routes.home()}>home page</Link>?
          </Trans>
        }
      />
      <div className="slds-align_absolute-center">
        <Login
          id="auth-error-login"
          label={user ? 'Log In With a Different Org' : 'Log In'}
          buttonClassName="slds-p-horizontal_xxx-small"
          buttonVariant="base"
        />
      </div>
    </>
  </DocumentTitle>
);

const select = (appState: AppState) => ({
  user: selectUserState(appState),
});

const WrappedAuthError: React.ComponentType<InitialProps> = connect(select)(
  AuthError,
);

export default WrappedAuthError;
