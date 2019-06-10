// @flow

import * as React from 'react';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';

const Header = (): React.Node => (
  <PageHeader
    className="page-header
      slds-p-around_x-large"
    title={i18n.t('Select a Product to Install')}
  />
);

export default Header;
