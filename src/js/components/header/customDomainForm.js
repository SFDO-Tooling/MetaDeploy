// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import KEYS from '@salesforce/design-system-react/utilities/key-code';

class CustomDomainForm extends React.Component<{}, { url: string }> {
  constructor(props: {}) {
    super(props);
    this.state = { url: '' };
  }

  handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = this.state.url.trim();
    if (!val) {
      return;
    }
    const baseUrl = window.api_urls.salesforce_custom_login();
    window.location.assign(`${baseUrl}?custom_domain=${val}`);
  };

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({ url: event.target.value });
  };

  trapEvent = (
    event:
      | SyntheticMouseEvent<HTMLFormElement>
      | SyntheticKeyboardEvent<HTMLFormElement>,
  ) => {
    if (
      !event ||
      (event.keyCode !== undefined && event.keyCode === KEYS.ESCAPE)
    ) {
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
        className="slds-p-vertical_x-small
          slds-p-horizontal_small"
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
          <p
            className="slds-p-vertical_x-small
              slds-truncate"
          >
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

export default CustomDomainForm;
