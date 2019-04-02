// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import { WarningIcon } from 'components/plans/jobResults';
import type {
  PreflightErrors as PreflightErrorsType,
  StepResult as StepResultType,
  Step as StepType,
} from 'store/plans/reducer';

type Props = {
  isOpen: boolean,
  toggleModal: boolean => void,
  startJob: () => void,
  results: PreflightErrorsType,
  steps: Array<StepType>,
};
type State = {
  confirmed: boolean,
};

const Warning = ({
  id,
  result,
  name,
}: {
  id: string,
  result: StepResultType,
  name?: string,
}): React.Node => {
  if (result.message && result.status === CONSTANTS.RESULT_STATUS.WARN) {
    return (
      <div className="slds-p-vertical_x-small">
        {name && id !== 'plan' ? (
          <h2
            className="slds-text-heading_small
              slds-p-bottom_x-small"
          >
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
    const { isOpen, startJob, results, steps } = this.props;
    const { confirmed } = this.state;
    const footer = [
      <Button key="cancel" label={t('Cancel')} onClick={this.handleClose} />,
      <Button
        key="submit"
        label={t('Confirm')}
        variant="brand"
        onClick={startJob}
        disabled={!confirmed}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        title={t('Potential Issues')}
        tagline={t('(confirm to continue)')}
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <div className="slds-p-horizontal_large slds-p-vertical_medium">
          {results.plan ? <Warning id="plan" result={results.plan} /> : null}
          {steps.map(step => {
            const stepResult = results[step.id];
            if (!stepResult) {
              return null;
            }
            return (
              <Warning
                key={step.id}
                id={step.id}
                result={stepResult}
                name={step.name}
              />
            );
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

export default PreflightWarningModal;
