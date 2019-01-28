// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';

type Props = {
  isOpen: boolean,
  text: string,
  toggleModal: boolean => void,
  startJob: () => void,
};
type State = {
  confirmed: boolean,
};

class ClickThroughAgreementModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { confirmed: false };
  }

  handleClose = () => {
    this.props.toggleModal(false);
    this.setState({ confirmed: false });
  };

  handleChange = (
    event: SyntheticInputEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    this.setState({ confirmed: checked });
  };

  render(): React.Node {
    const { isOpen, text, startJob } = this.props;
    const { confirmed } = this.state;
    const footer = [
      <Button key="cancel" label="Cancel" onClick={this.handleClose} />,
      <Button
        key="submit"
        label="Confirm"
        variant="brand"
        onClick={startJob}
        disabled={!confirmed}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        title="Product Terms of Use and Licenses"
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <div className="slds-p-horizontal_large slds-p-vertical_medium">
          {/* This text is pre-cleaned by the API */}
          <div
            className="
              slds-text-longform
              slds-scrollable_y
              slds-box"
            style={{ maxHeight: '250px' }}
            dangerouslySetInnerHTML={{
              __html: text,
            }}
          />
          <Checkbox
            id="click-through-confirm"
            className="slds-p-top_medium"
            checked={this.state.confirmed}
            labels={{
              label:
                'I confirm I have read and agree to these ' +
                'product terms of use and licenses.',
            }}
            onChange={this.handleChange}
          />
        </div>
      </Modal>
    );
  }
}

export default ClickThroughAgreementModal;
