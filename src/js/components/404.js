// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

const FourOhFour = () => (
  <DocumentTitle title="404 | MetaDeploy">
    <div className="slds-text-longform">
      <h1 className="slds-text-heading_large">Oh Noes!</h1>
      <p>
        That page cannot be found. Try the{' '}
        <Link to={routes.home()}>home page</Link>?
      </p>
    </div>
  </DocumentTitle>
);

export default FourOhFour;
