// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Link } from 'react-router-dom';

const FourOhFour = () => (
  <DocumentTitle title="404 | MetaDeploy">
    <div>
      Oops! That page cannot be found. Try the <Link to="/">home page</Link>?
    </div>
  </DocumentTitle>
);

export default FourOhFour;
