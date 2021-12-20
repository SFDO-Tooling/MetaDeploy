import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import withLanguageDirection from '@salesforce/design-system-react/components/utilities/UNSAFE_direction/private/language-direction';
import { t } from 'i18next';
import * as React from 'react';

import CustomDomainModal from '@/js/components/header/customDomainModal';
import { addUrlParams, UrlParams } from '@/js/utils/api';

type Props = {
  id: string;
  label?: string | React.ReactNode;
  buttonClassName: string;
  buttonVariant: string;
  triggerClassName?: string;
  direction: string;
  disabled: boolean;
  menuPosition: string;
  flipped: boolean;
  redirectParams: UrlParams;
};
type MenuOption = {
  label: string;
  login_domain: string;
  disabled: boolean;
};
type MenuDivider = { type: string };

class Login extends React.Component<Props, { modalOpen: boolean }> {
  static defaultProps = {
    id: 'login',
    buttonClassName: 'slds-button_outline-brand',
    buttonVariant: 'base',
    disabled: false,
    direction: 'ltr',
    menuPosition: 'overflowBoundaryElement',
    flipped: false,
    redirectParams: {},
  };

  constructor(props: Props) {
    super(props);
    this.state = { modalOpen: false };
  }

  toggleModal = (isOpen: boolean) => {
    this.setState({ modalOpen: isOpen });
  };

  handleSelect = (opt: MenuOption | MenuDivider) => {
    const login_domain = (opt as MenuOption).login_domain || '';
    if (login_domain === '') {
      this.toggleModal(true);
      return;
    }
    const { redirectParams } = this.props;
    window.location.assign(
      addUrlParams(window.api_urls.salesforce_login(), {
        custom_domain: login_domain,
        next: addUrlParams(window.location.href, redirectParams),
      }),
    );
  };

  static getMenuOpts(): (MenuOption | MenuDivider)[] {
    return [
      {
        label: t('Production or Developer Org'),
        login_domain: 'login',
        disabled: false,
      },
      {
        label: t('Sandbox or Scratch Org'),
        login_domain: 'test',
        disabled: false,
      },
      {
        type: 'divider',
      },
      {
        label: t('Use Custom Domain'),
        login_domain: '',
        disabled: false,
      },
    ];
  }

  render() {
    const menuOpts = Login.getMenuOpts();
    const {
      id,
      label,
      triggerClassName,
      buttonClassName,
      buttonVariant,
      disabled,
      direction,
      menuPosition,
      flipped,
      redirectParams,
    } = this.props;
    const { modalOpen } = this.state;
    /* istanbul ignore next */
    const nubbinPosition =
      direction === 'ltr'
        ? `top ${flipped ? 'left' : 'right'}`
        : `top ${flipped ? 'right' : 'left'}`;

    return (
      <>
        <Dropdown
          id={id}
          label={label === undefined ? t('Log In') : label}
          className="slds-dropdown_actions"
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

export default withLanguageDirection(Login);
