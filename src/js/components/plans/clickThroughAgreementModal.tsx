import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import * as React from 'react';

type Props = {
  isOpen: boolean;
  text: string;
  toggleModal: (open: boolean) => void;
  startJob: () => void;
};
type State = {
  confirmed: boolean;
};

class ClickThroughAgreementModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { confirmed: false };
  }

  handleClose = () => {
    this.setState({ confirmed: false });
    this.props.toggleModal(false);
  };

  handleSubmit = () => {
    const { startJob } = this.props;
    this.handleClose();
    startJob();
  };

  handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    this.setState({ confirmed: checked });
  };

  render() {
    const { isOpen, text } = this.props;
    const { confirmed } = this.state;
    const footer = [
      <Button
        key="cancel"
        label={i18n.t('Cancel')}
        onClick={this.handleClose}
      />,
      <Button
        key="submit"
        label={i18n.t('Confirm')}
        variant="brand"
        onClick={this.handleSubmit}
        disabled={!confirmed}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        heading={i18n.t('Product Terms of Use and Licenses')}
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <div className="slds-p-horizontal_large slds-p-vertical_medium">
          {/* This text is pre-cleaned by the API */}
          <div
            className="slds-text-longform slds-scrollable_y slds-box markdown"
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
              label: i18n.t(
                'I confirm I have read and agree to these product terms of use and licenses.',
              ),
            }}
            onChange={this.handleChange}
          />
        </div>
      </Modal>
    );
  }
}

export default ClickThroughAgreementModal;
