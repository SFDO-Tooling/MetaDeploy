import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import React, { ChangeEvent, Component } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';

import JobMessage from '@/js/components/jobs/jobMessage';
import {
  TransientMessageProps,
  withTransientMessage,
} from '@/js/components/utils';
import { JobUpdated } from '@/js/store/jobs/actions';
import { Job } from '@/js/store/jobs/reducer';
import { CONSTANTS, Plan } from '@/js/store/plans/reducer';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';
import { addUrlParams } from '@/js/utils/api';
import routes from '@/js/utils/routes';

type Props = {
  isOpen: boolean;
  job: Job;
  plan: Plan;
  scratchOrg?: ScratchOrg | null;
  toggleModal: (open: boolean) => void;
  updateJob: (payload: {
    [key: string]: unknown;
    readonly id: string;
  }) => Promise<JobUpdated>;
};
type WrappedProps = Props & TransientMessageProps & WithTranslation;

class ShareModal extends Component<WrappedProps> {
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

  handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { job, updateJob } = this.props;
    updateJob({ id: job.id, is_public: event.target.value });
  };

  storeInputRef = (input: HTMLInputElement) => {
    this.input = input;
    this.handleFocus();
  };

  getErrorMessage() {
    const { t, job, plan } = this.props;
    const hasError = job.error_count !== undefined && job.error_count > 0;
    const isFailed = job.status === CONSTANTS.STATUS.FAILED;
    const showError = hasError || isFailed;
    if (showError) {
      let stepName = null;
      let stepError = null;
      if (plan.steps?.length) {
        // Get step-specific error (and step name)
        // will return the first error present in the list
        // of results for a given step
        for (const stepId of Object.keys(job.results)) {
          for (const result of job.results[stepId]) {
            if (
              result.status === CONSTANTS.RESULT_STATUS.ERROR &&
              result.message
            ) {
              const step = plan.steps.find((s) => s.id === stepId);
              if (step) {
                stepError = result.message;
                stepName = step.name;
                break;
              }
            }
          }
        }
      }
      return (
        <div>
          <p className="slds-m-bottom_small">
            {t('Oh no! This installation encountered an error.')}
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
              {t(
                'Don’t panic. If you’re not sure what to do about this error, you can share the link below.',
              )}
            </p>
          )}
        </div>
      );
    }
    return null;
  }

  getScratchOrgInfo() {
    const { t, job, scratchOrg } = this.props;
    if (scratchOrg && job.status === CONSTANTS.STATUS.COMPLETE) {
      return (
        <div
          className="slds-text-longform
            slds-text-align_center
            slds-p-bottom_medium"
        >
          <p className="slds-text-color_success">
            {t('Installation completed successfully.')}
          </p>
          <JobMessage job={job} />
          {job.user_can_edit && (
            <p>
              <Trans i18nKey="scratchOrgInfo">
                To view your org right away, click the “View Scratch Org” button
                below. To view your org later, copy this link.
                <br />
                <strong>
                  You have also been sent an email to reset the password on your
                  new org.
                </strong>
              </Trans>
            </p>
          )}
        </div>
      );
    }
    return null;
  }

  getFooter() {
    const { t, job, scratchOrg } = this.props;
    if (
      scratchOrg &&
      job.status === CONSTANTS.STATUS.COMPLETE &&
      job.user_can_edit
    ) {
      return [
        <Button key="cancel" label={t('Cancel')} onClick={this.handleClose} />,
        <a
          key="view-org"
          href={window.api_urls.scratch_org_redirect(scratchOrg.id)}
          target="_blank"
          rel="noreferrer noopener"
          className="slds-button slds-button_brand"
        >
          <Icon
            containerClassName="slds-p-right_x-small"
            category="utility"
            name="new_window"
            size="x-small"
            inverse
          />
          {t('View Scratch Org')}
        </a>,
      ];
    }
    return null;
  }

  getShareForm() {
    const { t, job, transientMessageVisible, scratchOrg } = this.props;
    const isCompleteOnScratchOrg = Boolean(
      scratchOrg && job.status === CONSTANTS.STATUS.COMPLETE,
    );
    const { product_slug, version_label, plan_slug } = job;
    const url = routes.job_detail(
      product_slug,
      version_label,
      plan_slug,
      job.id,
    );

    return (
      <>
        <Input
          id="share-job-link"
          value={
            scratchOrg && isCompleteOnScratchOrg && job.user_can_edit
              ? addUrlParams(
                  url,
                  {
                    scratch_org_id: scratchOrg.uuid,
                  },
                  true,
                )
              : `${window.location.origin}${url}`
          }
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
          <div className="slds-form-element__help slds-text-color_success">
            {transientMessageVisible ? t('Copied to clipboard') : ''}
            {/* Space added to preserve height even when empty. */}
            &nbsp;
          </div>
        </Input>

        {!isCompleteOnScratchOrg && job.user_can_edit && (
          <div className="slds-p-top_small">
            <RadioGroup
              labels={{ label: t('Who can access this shared link?') }}
              name="is_public"
              onChange={this.handleChange}
            >
              <Radio
                id="is_public-false"
                labels={{
                  label: t(
                    'Only I and Salesforce staff can view this installation job.',
                  ),
                }}
                value="false"
                checked={!job.is_public}
              />
              <Radio
                id="is_public-true"
                labels={{
                  label: t(
                    'Anyone with the link can view this installation job.',
                  ),
                }}
                value="true"
                checked={job.is_public}
              />
            </RadioGroup>
            <p className="slds-text-body_small slds-p-top_small">
              {t(
                'Access to view the installation job does not provide access to your Salesforce org.',
              )}
            </p>
          </div>
        )}
      </>
    );
  }

  render() {
    const { t, scratchOrg, job } = this.props;
    const isCompleteOnScratchOrg = Boolean(
      scratchOrg && job.status === CONSTANTS.STATUS.COMPLETE,
    );
    const heading =
      isCompleteOnScratchOrg && job.user_can_edit
        ? t('Access Your Scratch Org')
        : t('Share Link to Installation Job');
    const errorMsg = this.getErrorMessage();
    return (
      <Modal
        isOpen={this.props.isOpen}
        size="medium"
        heading={
          errorMsg ? (
            <span className="slds-text-color_error">
              {t('Resolve Installation Error')}
            </span>
          ) : (
            heading
          )
        }
        footer={this.getFooter()}
        dismissOnClickOutside={false}
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
          {this.getScratchOrgInfo()}
          {this.getShareForm()}
        </div>
      </Modal>
    );
  }
}

const WrappedShareModal = withTranslation()(withTransientMessage(ShareModal));

export default WrappedShareModal;
