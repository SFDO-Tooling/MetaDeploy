import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import { t } from 'i18next';
import * as React from 'react';

import { addUrlParams, extractCustomDomain, UrlParams } from '@/js/utils/api';

type Props = {
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  redirectParams: UrlParams;
};

class CustomDomainModal extends React.Component<Props, { url: string }> {
  constructor(props: Props) {
    super(props);
    this.state = { url: '' };
  }

  handleClose = () => {
    this.setState({ url: '' });
    this.props.toggleModal(false);
  };

  handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = extractCustomDomain(this.state.url.trim());
    if (!val) {
      return;
    }
    const baseUrl = window.api_urls.salesforce_login();
    const { redirectParams } = this.props;
    window.location.assign(
      addUrlParams(baseUrl, {
        custom_domain: val,
        next: addUrlParams(window.location.href, redirectParams),
      }),
    );
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ url: event.target.value });
  };

  render() {
    const footer = [
      <Button key="cancel" label={t('Cancel')} onClick={this.handleClose} />,
      <Button
        key="submit"
        label={t('Continue')}
        variant="brand"
        onClick={this.handleSubmit}
      />,
    ];
    return (
      <Modal
        isOpen={this.props.isOpen}
        heading={t('Use Custom Domain')}
        size="small"
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <form className="slds-p-around_large" onSubmit={this.handleSubmit}>
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
              {this.state.url.trim() ? (
                extractCustomDomain(this.state.url.trim())
              ) : (
                <em>domain</em>
              )}
              .my.salesforce.com
            </div>
          </Input>
        </form>
      </Modal>
    );
  }
}

export default CustomDomainModal;
