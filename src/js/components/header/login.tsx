import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import withLanguageDirection from '@salesforce/design-system-react/components/utilities/UNSAFE_direction/private/language-direction';
import i18n from 'i18next';
import cookies from 'js-cookie';
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

interface LoginFormElements extends HTMLFormControlsCollection {
  csrfmiddlewaretoken: HTMLInputElement;
  next: HTMLInputElement;
  custom_domain: HTMLInputElement;
}

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

  private formRef = React.createRef<HTMLFormElement>();

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
    const form = this.formRef.current;
    if (form) {
      const elements = form.elements as LoginFormElements;
      elements.custom_domain.value = login_domain;
      form.submit();
    }
  };

  static getMenuOpts(): (MenuOption | MenuDivider)[] {
    return [
      {
        label: i18n.t('Production or Developer Org'),
        login_domain: 'login',
        disabled: false,
      },
      {
        label: i18n.t('Sandbox or Scratch Org'),
        login_domain: 'test',
        disabled: false,
      },
      {
        type: 'divider',
      },
      {
        label: i18n.t('Use Custom Domain'),
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
          label={label === undefined ? i18n.t('Log In') : label}
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
        {/* POSTing instead of redirecting to the login endpoint is more secure */}
        <form
          method="POST"
          action={window.api_urls.salesforce_login()}
          ref={this.formRef}
        >
          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={cookies.get('csrftoken')}
          />
          <input
            type="hidden"
            name="next"
            value={addUrlParams(window.location.href, redirectParams)}
            data-testid="login-next"
          />
          <input
            type="hidden"
            name="custom_domain"
            value={'' /* Actual value will be set handleSelect */}
            data-testid="custom-domain"
          />
        </form>
      </>
    );
  }
}

export default withLanguageDirection(Login);
