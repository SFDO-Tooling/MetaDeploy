import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import i18n from 'i18next';
import * as React from 'react';

import {
  TransientMessageProps,
  withTransientMessage,
} from '@/components/utils';
import { JobUpdated } from '@/store/jobs/actions';
import { Job } from '@/store/jobs/reducer';
import { CONSTANTS, Plan } from '@/store/plans/reducer';

type Props = {
  isOpen: boolean;
  job: Job;
  plan: Plan;
  toggleModal: (open: boolean) => void;
  updateJob: (payload: {
    [key: string]: unknown;
    readonly id: string;
  }) => Promise<JobUpdated>;
};
type WrappedProps = Props & TransientMessageProps;

class ShareModal extends React.Component<WrappedProps> {
  input: HTMLInputElement | null | undefined;

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

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { job, updateJob } = this.props;
    updateJob({ id: job.id, is_public: event.target.value });
  };

  storeInputRef = (input: HTMLInputElement) => {
    this.input = input;
    this.handleFocus();
  };

  getErrorMessage() {
    const { job, plan } = this.props;
    const hasError = job.error_count !== undefined && job.error_count > 0;
    const isFailed = job.status === CONSTANTS.STATUS.FAILED;
    const showError = hasError || isFailed;
    if (showError) {
      let stepName = null;
      let stepError = null;
      if (plan.steps?.length) {
        // Get step-specific error (and step name)
        for (const id of Object.keys(job.results)) {
          const result = job.results[id];
          if (
            result.status === CONSTANTS.RESULT_STATUS.ERROR &&
            result.message
          ) {
            const step = plan.steps.find((s) => s.id === id);
            if (step) {
              stepError = result.message;
              stepName = step.name;
              break;
            }
          }
        }
      }
      return (
        <div>
          <p className="slds-m-bottom_small">
            {i18n.t('Oh no! This installation encountered an error.')}
          </p>
          {stepName && stepError ? (
            <p className="slds-m-bottom_small">
              <b>{stepName}: </b>
              {/* These messages are pre-cleaned by the API */}
              <span
                className="slds-text-color_error"
                dangerouslySetInnerHTML={{ __html: stepError }}
              />
            </p>
          ) : null}
          {job.error_message ? (
            <div
              className="markdown"
              dangerouslySetInnerHTML={{ __html: job.error_message }}
            />
          ) : (
            <p>
              {i18n.t(
                'Don’t panic. If you’re not sure what to do about this error, you can share the link below.',
              )}
            </p>
          )}
        </div>
      );
    }
    return null;
  }

  render() {
    const { job, transientMessageVisible } = this.props;
    const errorMsg = this.getErrorMessage();
    return (
      <Modal
        isOpen={this.props.isOpen}
        heading={
          errorMsg ? (
            <span className="slds-text-color_error">
              {i18n.t('Resolve Installation Error')}
            </span>
          ) : (
            i18n.t('Share Link to Installation Job')
          )
        }
        size="medium"
        onRequestClose={this.handleClose}
      >
        <div
          className="slds-p-vertical_large
            slds-p-left_large
            slds-p-right_medium"
        >
          {errorMsg ? (
            <>
              {errorMsg}
              <hr />
            </>
          ) : null}
          <Input
            className="slds-p-bottom_small"
            id="share-job-link"
            value={window.location.href}
            type="url"
            readOnly
            fixedTextRight={
              <Button
                label={i18n.t('Copy Link')}
                variant="brand"
                onClick={this.handleCopy}
                style={{ whiteSpace: 'nowrap' }}
              />
            }
            inputRef={this.storeInputRef}
            onFocus={this.handleFocus}
          >
            <div className="slds-form-element__help slds-text-color_success">
              {transientMessageVisible ? i18n.t('Copied to clipboard') : ''}
              {/* Space added to preserve height even when empty. */}
              &nbsp;
            </div>
          </Input>

          {job.user_can_edit ? (
            <>
              <RadioGroup
                labels={{ label: i18n.t('Who can access this shared link?') }}
                name="is_public"
                onChange={this.handleChange}
              >
                <Radio
                  id="is_public-false"
                  labels={{
                    label: i18n.t(
                      'Only I and Salesforce staff can view this installation job.',
                    ),
                  }}
                  value="false"
                  checked={!job.is_public}
                />
                <Radio
                  id="is_public-true"
                  labels={{
                    label: i18n.t(
                      'Anyone with the link can view this installation job.',
                    ),
                  }}
                  value="true"
                  checked={job.is_public}
                />
              </RadioGroup>
              <p className="slds-text-body_small slds-p-top_small">
                {i18n.t(
                  'Access to view the installation job does not provide access to your Salesforce org.',
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
