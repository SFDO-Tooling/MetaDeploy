// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import * as i18n from 'i18next';

import { CONSTANTS } from 'plans/reducer';

import { WarningIcon } from 'components/plans/jobResults';

import type {
  StepResult as StepResultType,
  PreflightErrors as PreflightErrorsType,
  Step as StepType,
} from 'plans/reducer';

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

const WarningList = ({
  id,
  results,
  name,
}: {
  id: string,
  results: Array<StepResultType>,
  name?: string,
}): React.Node => {
  const warnings = [];
  for (const [idx, result] of results.entries()) {
    if (result.message && result.status === CONSTANTS.RESULT_STATUS.WARN) {
      warnings.push(
        <li key={`${id}-${idx}`}>
          <WarningIcon />
          {/* These messages are pre-cleaned by the API */}
          <span dangerouslySetInnerHTML={{ __html: result.message }} />
        </li>,
      );
    }
  }
  if (!warnings.length) {
    return null;
  }
  return (
    <div className="slds-p-vertical_x-small">
      {name && id !== 'plan' ? (
        <h3
          className="slds-text-heading_small
            slds-p-bottom_x-small"
        >
          {i18n.t(name)}
        </h3>
      ) : null}
      <ul>{warnings}</ul>
    </div>
  );
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
      <Button
        key="cancel"
        label={i18n.t('Cancel')}
        onClick={this.handleClose}
      />,
      <Button
        key="submit"
        label={i18n.t('Confirm')}
        variant="brand"
        onClick={startJob}
        disabled={!confirmed}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        title={i18n.t('Potential Issues')}
        tagline={i18n.t('(confirm to continue)')}
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <div className="slds-p-horizontal_large slds-p-vertical_medium">
          {results.plan ? (
            <WarningList id="plan" results={results.plan} />
          ) : null}
          {steps.map(step => {
            const stepResults = results[step.id];
            if (!stepResults) {
              return null;
            }
            return (
              <WarningList
                key={step.id}
                id={step.id}
                results={stepResults}
                name={step.name}
              />
            );
          })}
          <Checkbox
            id="preflight-warning-confirm"
            className="slds-p-top_x-small"
            checked={this.state.confirmed}
            labels={{
              label: i18n.t(
                'I understand these warnings, ' +
                  'and want to continue with installation.',
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
