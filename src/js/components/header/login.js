// @flow

import * as React from 'react';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import List from '@salesforce/design-system-react/components/menu-list/list';

import CustomDomainForm from 'components/header/customDomainForm';

const Login = () => {
  if (!window.api_urls.salesforce_production_login) {
    window.console.error(
      'Login URL not found for salesforce_production provider.',
    );
  }
  if (!window.api_urls.salesforce_test_login) {
    window.console.error('Login URL not found for salesforce_test provider.');
  }
  if (!window.api_urls.salesforce_custom_login) {
    window.console.error('Login URL not found for salesforce_custom provider.');
  }
  const menuOpts = [
    {
      label: 'Production or Developer Org',
      href:
        window.api_urls.salesforce_production_login &&
        window.api_urls.salesforce_production_login(),
      disabled: !window.api_urls.salesforce_production_login,
    },
    {
      label: 'Sandbox or Scratch Org',
      href:
        window.api_urls.salesforce_test_login &&
        window.api_urls.salesforce_test_login(),
      disabled: !window.api_urls.salesforce_test_login,
    },
    {
      type: 'divider',
    },
  ];
  return (
    <Dropdown
      id="login"
      label="Log In"
      className="slds-dropdown_actions
        slds-dropdown_medium"
      buttonVariant="brand"
      menuPosition="relative"
      nubbinPosition="top right"
      options={menuOpts}
      onSelect={opt => {
        /* istanbul ignore else */
        if (opt && opt.href) {
          window.location.assign(opt.href);
        }
      }}
    >
      <List options={menuOpts} />
      <CustomDomainForm />
    </Dropdown>
  );
};

export default Login;
