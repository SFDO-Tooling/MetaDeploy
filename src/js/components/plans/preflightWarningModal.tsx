import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import * as React from 'react';

import { SelectedSteps } from '@/components/plans/detail';
import { WarningIcon } from '@/components/plans/preflightResults';
import {
  CONSTANTS,
  PlanResults,
  Step,
  StepResult,
} from '@/store/plans/reducer';

type Props = {
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  startJob: () => void;
  results: PlanResults;
  steps: Step[];
  selectedSteps: SelectedSteps;
};
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

class PreflightWarningModal extends React.Component<Props, State> {
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
    const { isOpen, results, steps, selectedSteps } = this.props;
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
        heading={i18n.t('Potential Issues')}
        tagline={i18n.t('(confirm to continue)')}
        size="medium"
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
              label: i18n.t(
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

export default PreflightWarningModal;
