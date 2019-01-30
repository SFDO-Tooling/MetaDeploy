// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import { t } from 'i18next';

import { withTransientMessage } from 'components/utils';

import type { Job as JobType } from 'jobs/reducer';
import type { TransientMessageProps } from 'components/utils';
import typeof { updateJob as UpdateJobType } from 'jobs/actions';

type Props = {|
  isOpen: boolean,
  job: JobType,
  toggleModal: boolean => void,
  updateJob: UpdateJobType,
|};
type WrappedProps = Props & TransientMessageProps;

class ShareModal extends React.Component<WrappedProps> {
  input: ?HTMLInputElement;

  handleClose = () => {
    const { toggleModal, hideTransientMessage } = this.props;
    /* istanbul ignore else */
    if (hideTransientMessage) {
      hideTransientMessage();
    }
    toggleModal(false);
  };

  handleCopy = () => {
    const { showTransientMessage } = this.props;
    this.handleFocus();
    document.execCommand('copy');
    /* istanbul ignore else */
    if (showTransientMessage) {
      showTransientMessage();
    }
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

  storeInputRef = (input: HTMLInputElement) => {
    this.input = input;
    this.handleFocus();
  };

  render(): React.Node {
    const { job, transientMessageVisible } = this.props;
    return (
      <Modal
        isOpen={this.props.isOpen}
        title={t('Share Link to Installation Job')}
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
                label={t('Copy Link')}
                variant="brand"
                onClick={this.handleCopy}
                style={{ whiteSpace: 'nowrap' }}
              />
            }
            inputRef={this.storeInputRef}
            onFocus={this.handleFocus}
          >
            <div
              className="slds-form-element__help
                slds-text-color_success"
            >
              {transientMessageVisible ? t('Copied to clipboard') : ''}
              {/* Space added to preserve height even when empty. */}
              &nbsp;
            </div>
          </Input>

          {job.user_can_edit ? (
            <>
              <RadioGroup
                labels={{ label: t('Who can access this shared link?') }}
                name="is_public"
                onChange={this.handleChange}
              >
                <Radio
                  id="is_public-false"
                  label={t(
                    'Only I and Salesforce staff ' +
                      'can view this installation job.',
                  )}
                  value="false"
                  checked={!job.is_public}
                />
                <Radio
                  id="is_public-true"
                  label={t(
                    'Anyone with the link can view this installation job.',
                  )}
                  value="true"
                  checked={job.is_public}
                />
              </RadioGroup>
              <p
                className="slds-text-body_small
                  slds-p-top_small"
              >
                {t(
                  'Access to view the installation job does not provide ' +
                    'access to your Salesforce org.',
                )}
              </p>
            </>
          ) : null}
        </div>
      </Modal>
    );
  }
}

const WrappedShareModal = withTransientMessage(ShareModal);

export default WrappedShareModal;
