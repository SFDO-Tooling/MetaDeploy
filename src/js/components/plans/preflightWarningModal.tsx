import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { ChangeEvent, Component } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { SelectedSteps } from '@/js/components/plans/detail';
import { WarningIcon } from '@/js/components/plans/preflightResults';
import {
  CONSTANTS,
  PlanResults,
  Step,
  StepResult,
} from '@/js/store/plans/reducer';

type Props = {
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  startJob: () => void;
  results: PlanResults;
  steps: Step[];
  selectedSteps: SelectedSteps;
} & WithTranslation;
type State = {
  confirmed: boolean;
};

const Warning = ({
  id,
  result,
  name,
}: {
  id: string;
  result: StepResult;
  name?: string;
}) => {
  if (result.message && result.status === CONSTANTS.RESULT_STATUS.WARN) {
    return (
      <div className="slds-p-vertical_x-small">
        {name && id !== 'plan' ? (
          <h2 className="slds-text-heading_small slds-p-bottom_x-small">
            {name}
          </h2>
        ) : null}
        <ul>
          <li>
            <WarningIcon />
            {/* These messages are pre-cleaned by the API */}
            <span dangerouslySetInnerHTML={{ __html: result.message }} />
          </li>
        </ul>
      </div>
    );
  }
  return null;
};

class PreflightWarningModal extends Component<Props, State> {
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
    event: ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    this.setState({ confirmed: checked });
  };

  render() {
    const { t, isOpen, results, steps, selectedSteps } = this.props;
    const { confirmed } = this.state;
    const footer = [
      <Button key="cancel" label={t('Cancel')} onClick={this.handleClose} />,
      <Button
        key="submit"
        label={t('Confirm')}
        variant="brand"
        onClick={this.handleSubmit}
        disabled={!confirmed}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        heading={t('Potential Issues')}
        tagline={t('(confirm to continue)')}
        size="medium"
        dismissOnClickOutside={false}
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <div className="slds-p-horizontal_large slds-p-vertical_medium">
          {results.plan
            ? results.plan.map((result) => (
                <Warning key="id" id="plan" result={result} />
              ))
            : null}
          {[...selectedSteps].map((id) => {
            const step = steps.find((s) => s.id === id);
            const stepResults = results[id];
            if (!step || !stepResults) {
              return null;
            }
            return stepResults.map((result) => (
              <Warning key={id} id={id} result={result} name={step.name} />
            ));
          })}
          <Checkbox
            id="preflight-warning-confirm"
            className="slds-p-top_x-small"
            checked={this.state.confirmed}
            labels={{
              label: t(
                'I understand these warnings, and want to continue with installation.',
              ),
            }}
            onChange={this.handleChange}
          />
        </div>
      </Modal>
    );
  }
}

export default withTranslation()(PreflightWarningModal);
