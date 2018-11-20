// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import { EmptyIllustration } from 'components/404';

const AuthError = () => (
  <DocumentTitle title="Login Error | MetaDeploy">
    <EmptyIllustration
      message={
        <>
          An error occurred while attempting to log in. Try the{' '}
          <Link to={routes.home()}>home page</Link>?
        </>
      }
    />
  </DocumentTitle>
);

export default AuthError;
