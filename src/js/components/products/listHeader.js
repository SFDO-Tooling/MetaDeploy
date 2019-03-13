// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { t } from 'i18next';

const Header = (): React.Node => (
  <>
    <PageHeader
      className="page-header
        slds-p-around_x-large"
      title={t('Select a Product to Install')}
    />
    <p>{window.GLOBALS.SITE && window.GLOBALS.SITE.welcome_text}</p>
  </>
);

export default Header;
