// @flow

import * as React from 'react';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';

import { logError } from 'utils/logging';

import CustomDomainModal from 'components/header/customDomainModal';

class Login extends React.Component<{}, { modalOpen: boolean }> {
  constructor(props: {}) {
    super(props);
    this.state = { modalOpen: false };
    if (!window.api_urls.salesforce_production_login) {
      logError('Login URL not found for salesforce_production provider.');
    }
    if (!window.api_urls.salesforce_test_login) {
      logError('Login URL not found for salesforce_test provider.');
    }
    if (!window.api_urls.salesforce_custom_login) {
      logError('Login URL not found for salesforce_custom provider.');
    }
  }

  toggleModal = (isOpen: boolean) => {
    this.setState({ modalOpen: isOpen });
  };

  render(): React.Node {
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
      {
        label: 'Use Custom Domain',
        modal: Boolean(window.api_urls.salesforce_custom_login),
        disabled: !window.api_urls.salesforce_custom_login,
      },
    ];
    return (
      <div>
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
            if (opt.modal) {
              this.toggleModal(true);
              return;
            }
            if (opt.href) {
              window.location.assign(opt.href);
            }
          }}
        />
        <CustomDomainModal
          isOpen={this.state.modalOpen}
          toggleModal={this.toggleModal}
        />
      </div>
    );
  }
}

export default Login;
