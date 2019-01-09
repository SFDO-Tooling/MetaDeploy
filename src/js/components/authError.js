// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { selectUserState } from 'components/header';

import Login from 'components/header/login';
import { EmptyIllustration } from 'components/404';

import type { AppState } from 'app/reducer';
import type { InitialProps } from 'components/utils';
import type { User as UserType } from 'accounts/reducer';

const AuthError = ({ user }: { user: UserType }) => (
  <DocumentTitle title="Authentication Error | MetaDeploy">
    <>
      <EmptyIllustration
        message={
          <>
            An error occurred with your account. Try the{' '}
            <Link to={routes.home()}>home page</Link>?
          </>
        }
      />
      <div className="slds-align_absolute-center">
        <Login
          id="auth-error-login"
          label={user ? 'Log In With a Different Org' : 'Log In'}
          buttonClassName="slds-p-horizontal_xxx-small"
          buttonVariant="base"
          nubbinPosition="top"
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
