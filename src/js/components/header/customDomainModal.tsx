import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import cookies from 'js-cookie';
import React, { ChangeEvent, Component, createRef, FormEvent } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { addUrlParams, extractCustomDomain, UrlParams } from '@/js/utils/api';

type Props = {
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  redirectParams: UrlParams;
} & WithTranslation;

class CustomDomainModal extends Component<
  Props,
  { url: string; customDomain: string }
> {
  private formRef = createRef<HTMLFormElement>();

  constructor(props: Props) {
    super(props);
    this.state = { url: '', customDomain: '' };
  }

  handleClose = () => {
    this.setState({ url: '', customDomain: '' });
    this.props.toggleModal(false);
  };

  handleSubmitClicked = () => {
    this.formRef.current?.submit();
  };

  handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    /* istanbul ignore if */
    if (!this.state.customDomain) {
      event.preventDefault();
    }
  };

  handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      url: event.target.value,
      customDomain: extractCustomDomain(event.target.value.trim()),
    });
  };

  render() {
    const { t } = this.props;
    const footer = [
      <Button key="cancel" label={t('Cancel')} onClick={this.handleClose} />,
      <Button
        key="submit"
        label={t('Continue')}
        variant="brand"
        onClick={this.handleSubmitClicked}
        disabled={!this.state.customDomain}
      />,
    ];
    return (
      <Modal
        isOpen={this.props.isOpen}
        heading={t('Use Custom Domain')}
        size="small"
        dismissOnClickOutside={false}
        onRequestClose={this.handleClose}
        footer={footer}
      >
        {/* POSTing instead of redirecting to the login endpoint is more secure */}
        <form
          method="POST"
          className="slds-p-around_large"
          action={window.api_urls.salesforce_login()}
          ref={this.formRef}
          data-testid="modal-form"
          onSubmit={this.handleSubmit}
        >
          <div className="slds-form-element__help slds-p-bottom_small">
            {t(
              'To go to your company’s login page, enter the custom domain name.',
            )}
          </div>
          <Input
            id="login-custom-domain"
            label={t('Custom Domain')}
            value={this.state.url}
            onChange={this.handleChange}
            aria-describedby="login-custom-domain-help"
          >
            <div
              id="login-custom-domain-help"
              className="slds-form-element__help slds-truncate slds-p-top_small"
              data-testid="custom-domain"
            >
              https://
              {this.state.customDomain || <em>domain</em>}
              .my.salesforce.com
            </div>
          </Input>

          <input
            type="hidden"
            name="csrfmiddlewaretoken"
            value={cookies.get('csrftoken')}
          />
          <input
            type="hidden"
            name="next"
            value={addUrlParams(
              window.location.href,
              this.props.redirectParams,
            )}
            data-testid="custom-login-next"
          />
          <input
            type="hidden"
            name="custom_domain"
            value={this.state.customDomain}
          />
        </form>
      </Modal>
    );
  }
}

export default withTranslation()(CustomDomainModal);
