// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import DropdownTrigger from '@salesforce/design-system-react/components/menu-dropdown/button-trigger';
import Input from '@salesforce/design-system-react/components/input';
import KEYS from '@salesforce/design-system-react/utilities/key-code';
import List from '@salesforce/design-system-react/components/menu-list/list';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import routes from 'utils/routes';
import { logout } from 'accounts/actions';

import type { User } from 'accounts/reducer';

const selectUserState = (appState): User => appState.user;

const select = appState => ({
  user: selectUserState(appState),
});

const actions = {
  doLogout: logout,
};

class CustomDomainForm extends React.Component<{}, { url: string }> {
  constructor(props) {
    super(props);
    this.state = { url: '' };
  }

  handleSubmit = event => {
    event.preventDefault();
    const val = this.state.url.trim();
    if (!val) {
      return;
    }
    const baseUrl = window.api_urls.salesforce_custom_login();
    window.location.assign(`${baseUrl}?custom_domain=${val}`);
  };

  handleChange = event => {
    this.setState({ url: event.target.value });
  };

  trapEvent = event => {
    if (!event || (event.keyCode && event.keyCode === KEYS.ESCAPE)) {
      return;
    }
    event.stopPropagation();
    /* istanbul ignore else */
    if (event.nativeEvent && event.nativeEvent.stopPropagation) {
      event.nativeEvent.stopPropagation();
    }
  };

  render(): React.Node {
    return (
      <form
        className="slds-p-vertical_x-small slds-p-horizontal_small"
        onClick={this.trapEvent}
        onKeyDown={this.trapEvent}
        onSubmit={this.handleSubmit}
      >
        <Input
          id="login-custom-domain"
          label="Use Custom Domain"
          value={this.state.url}
          onChange={this.handleChange}
          assistiveText={null}
          disabled={!window.api_urls.salesforce_custom_login}
        >
          <p className="slds-p-vertical_x-small">
            https://
            {this.state.url.trim() ? (
              this.state.url.trim()
            ) : (
              <em data-testid="custom-domain">domain</em>
            )}
            .my.salesforce.com
          </p>
        </Input>
        <Button
          className="slds-size_full"
          type="submit"
          label="Continue"
          variant="neutral"
          disabled={!window.api_urls.salesforce_custom_login}
        />
      </form>
    );
  }
}

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
      className="slds-dropdown_actions"
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

const Logout = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: typeof logout,
}) => (
  <Dropdown
    id="logout"
    options={[
      {
        label: user && user.username,
        type: 'header',
      },
      {
        label: 'Log Out',
        leftIcon: {
          name: 'logout',
          category: 'utility',
        },
      },
    ]}
    onSelect={doLogout}
    menuPosition="relative"
    nubbinPosition="top right"
  >
    <DropdownTrigger>
      <Button variant="icon">
        <Avatar />
      </Button>
    </DropdownTrigger>
  </Dropdown>
);

const Header = ({
  user,
  doLogout,
}: {
  user: User,
  doLogout: typeof logout,
}) => (
  <PageHeader
    className="page-header"
    title={
      <Link
        to={routes.home()}
        className="slds-page-header__title slds-text-heading_large
          slds-text-link_reset"
      >
        <span data-logo-bit="start">meta</span>
        <span data-logo-bit="end">deploy</span>
      </Link>
    }
    navRight={
      <div>
        <Link
          to={routes.product_list()}
          className="slds-text-heading_small slds-p-right_large
            slds-text-link_reset slds-align-middle"
        >
          Products
        </Link>
        {user && user.username ? (
          <Logout user={user} doLogout={doLogout} />
        ) : (
          <Login />
        )}
      </div>
    }
    variant="objectHome"
  />
);

export default connect(
  select,
  actions,
)(Header);
