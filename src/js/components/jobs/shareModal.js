// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';

import type { Job as JobType } from 'jobs/reducer';
import type { User as UserType } from 'accounts/reducer';
import typeof { updateJob as UpdateJobType } from 'jobs/actions';

type Props = {
  isOpen: boolean,
  job: JobType,
  user: UserType,
  toggleModal: boolean => void,
  updateJob: UpdateJobType,
};
type State = {
  showSuccessMessage: boolean,
};

class ShareModal extends React.Component<Props, State> {
  input: ?HTMLInputElement;

  timeout: ?TimeoutID;

  constructor(props: Props) {
    super(props);
    this.state = { showSuccessMessage: false };
    this.timeout = null;
  }

  componentWillUnmount() {
    this.clearTimeout();
  }

  clearTimeout() {
    if (this.timeout !== undefined && this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  handleClose = () => {
    this.setState({ showSuccessMessage: false });
    this.clearTimeout();
    this.props.toggleModal(false);
  };

  handleCopy = () => {
    this.handleFocus();
    document.execCommand('copy');
    this.setState({ showSuccessMessage: true });
    this.clearTimeout();
    this.timeout = setTimeout(() => {
      this.setState({ showSuccessMessage: false });
      this.clearTimeout();
    }, 5 * 1000);
  };

  handleFocus = () => {
    if (this.input) {
      this.input.select();
    }
  };

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const { job, updateJob } = this.props;
    updateJob({ id: job.id, is_public: event.target.value });
  };

  render(): React.Node {
    const { job, user } = this.props;
    const { showSuccessMessage } = this.state;
    const myJob =
      user &&
      user.username &&
      job.creator &&
      job.creator.username === user.username;
    return (
      <Modal
        isOpen={this.props.isOpen}
        title="Share Link to Installation Job"
        onRequestClose={this.handleClose}
      >
        <div
          className="slds-p-vertical_large
            slds-p-left_large
            slds-p-right_medium"
        >
          <Input
            className="slds-p-bottom_small"
            id="share-job-link"
            value={window.location.href}
            type="url"
            readOnly
            fixedTextRight={
              <Button
                label="Copy Link"
                variant="brand"
                onClick={this.handleCopy}
                style={{ whiteSpace: 'nowrap' }}
              />
            }
            inputRef={input => {
              this.input = input;
              this.handleFocus();
            }}
            onFocus={this.handleFocus}
          >
            <span
              className="slds-form-element__help
                slds-text-color_success"
            >
              {showSuccessMessage ? 'Copied to clipboard' : ''}
              &nbsp;
            </span>
          </Input>

          {myJob ? (
            <RadioGroup
              labels={{ label: 'Who can access this shared link?' }}
              name="is_public"
              onChange={this.handleChange}
            >
              <Radio
                id="is_public-false"
                label={
                  'Only me and Salesforce staff ' +
                  'can view this installation job.'
                }
                value="false"
                checked={!job.is_public}
              />
              <Radio
                id="is_public-true"
                label="Anyone with the link can view this installation job."
                value="true"
                checked={job.is_public}
              />
            </RadioGroup>
          ) : null}
        </div>
      </Modal>
    );
  }
}

export default ShareModal;
