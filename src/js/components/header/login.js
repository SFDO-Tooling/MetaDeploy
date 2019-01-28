// @flow

import * as React from 'react';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';

import { addUrlParams } from 'utils/api';
import { logError } from 'utils/logging';

import CustomDomainModal from 'components/header/customDomainModal';

import type { UrlParams } from 'utils/api';
import type { I18nProps } from 'components/utils';
import { withI18n } from 'react-i18next';

type Props = {
  id: string,
  label: string | React.Node,
  buttonClassName: string,
  buttonVariant: string,
  triggerClassName?: string,
  disabled: boolean,
  menuPosition: string,
  nubbinPosition: string,
  redirectParams: UrlParams,
  ...I18nProps,
};
type MenuOption =
  | {|
      label: string,
      href?: string,
      disabled: boolean,
      modal?: boolean,
    |}
  | {| type: string |};

class BaseLogin extends React.Component<Props, { modalOpen: boolean }> {
  static defaultProps = {
    id: 'login',
    label: 'Log In',
    buttonClassName: 'slds-button_outline-brand',
    buttonVariant: 'base',
    disabled: false,
    menuPosition: 'overflowBoundaryElement',
    nubbinPosition: 'top right',
    redirectParams: {},
  };

  constructor(props: Props) {
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

  handleSelect = (opt: MenuOption) => {
    if (opt.modal) {
      this.toggleModal(true);
      return;
    }
    if (opt.href) {
      const { redirectParams } = this.props;
      window.location.assign(
        addUrlParams(opt.href, {
          next: addUrlParams(window.location.href, redirectParams),
        }),
      );
    }
  };

  getMenuOpts(): Array<MenuOption> {
    const { t } = this.props;
    return [
      {
        label: t('Production or Developer Org'),
        href:
          window.api_urls.salesforce_production_login &&
          window.api_urls.salesforce_production_login(),
        disabled: !window.api_urls.salesforce_production_login,
      },
      {
        label: t('Sandbox or Scratch Org'),
        href:
          window.api_urls.salesforce_test_login &&
          window.api_urls.salesforce_test_login(),
        disabled: !window.api_urls.salesforce_test_login,
      },
      {
        type: 'divider',
      },
      {
        label: t('Use Custom Domain'),
        modal: Boolean(window.api_urls.salesforce_custom_login),
        disabled: !window.api_urls.salesforce_custom_login,
      },
    ];
  }

  render(): React.Node {
    const menuOpts = this.getMenuOpts();
    const {
      id,
      label,
      triggerClassName,
      buttonClassName,
      buttonVariant,
      disabled,
      menuPosition,
      nubbinPosition,
      redirectParams,
      t,
    } = this.props;
    const { modalOpen } = this.state;

    const dropdownLabel = typeof label === 'string' ? t(label) : label;
    return (
      <>
        <Dropdown
          id={id}
          label={dropdownLabel}
          className="slds-dropdown_actions
            slds-dropdown_medium"
          triggerClassName={triggerClassName}
          buttonClassName={buttonClassName}
          buttonVariant={buttonVariant}
          disabled={disabled}
          menuPosition={menuPosition}
          nubbinPosition={nubbinPosition}
          iconCategory="utility"
          iconName="down"
          iconPosition="right"
          options={menuOpts}
          onSelect={this.handleSelect}
        />
        <CustomDomainModal
          isOpen={modalOpen}
          toggleModal={this.toggleModal}
          redirectParams={redirectParams}
        />
      </>
    );
  }
}

const Login = withI18n()(BaseLogin);

export default Login;
