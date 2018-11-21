// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';

import { CONSTANTS } from 'plans/reducer';

import type { PreflightErrors as PreflightErrorsType } from 'plans/reducer';

type Warning = {| id: string, name?: string, message: string |};
type Props = {
  isOpen: boolean,
  toggleModal: boolean => void,
  startJob: () => void,
  results: PreflightErrorsType,
  stepNames: Map<string, string>,
};
type State = {
  confirmed: Set<string>,
};

class PreflightWarningModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { confirmed: new Set() };
  }

  handleClose = () => {
    this.props.toggleModal(false);
    this.setState({ confirmed: new Set() });
  };

  handleChange = (id: string, checked: boolean) => {
    const confirmed = new Set([...this.state.confirmed]);
    if (checked && !confirmed.has(id)) {
      confirmed.add(id);
      this.setState({ confirmed });
      return;
    }
    /* istanbul ignore else */
    if (!checked && confirmed.has(id)) {
      confirmed.delete(id);
      this.setState({ confirmed });
    }
  };

  getWarning({ id, name, message }: Warning): React.Node {
    return (
      <li key={id} className="slds-p-vertical_x-small">
        <p>
          {name ? `${name} — ` : null}
          {/* These messages are pre-cleaned by the API */}
          <span dangerouslySetInnerHTML={{ __html: message }} />
        </p>
        <Checkbox
          id={`step-${id}-warning`}
          checked={this.state.confirmed.has(id)}
          labels={{ label: 'I understand.' }}
          onChange={(
            event: SyntheticInputEvent<HTMLInputElement>,
            { checked }: { checked: boolean },
          ) => {
            this.handleChange(id, checked);
          }}
        />
      </li>
    );
  }

  getWarnings(): Array<Warning> {
    const { results, stepNames } = this.props;
    const warnings = [];
    for (const id of Object.keys(results)) {
      const stepResults = results[id];
      if (!stepResults) {
        break;
      }
      const name = stepNames.get(id);
      for (const [idx, result] of stepResults.entries()) {
        if (result.message && result.status === CONSTANTS.RESULT_STATUS.WARN) {
          warnings.push({ id: `${id}-${idx}`, name, message: result.message });
        }
      }
    }
    return warnings;
  }

  render(): React.Node {
    const { isOpen, startJob } = this.props;
    const { confirmed } = this.state;
    const warnings = this.getWarnings();
    const footer = [
      <Button key="cancel" label="Cancel" onClick={this.handleClose} />,
      <Button
        key="submit"
        label="Confirm"
        variant="brand"
        onClick={startJob}
        disabled={[...confirmed].length !== warnings.length}
      />,
    ];
    return (
      <Modal
        isOpen={isOpen}
        title="Please Confirm"
        onRequestClose={this.handleClose}
        footer={footer}
      >
        <ul className="slds-p-horizontal_large slds-p-vertical_medium">
          {warnings.map(this.getWarning, this)}
        </ul>
      </Modal>
    );
  }
}

export default PreflightWarningModal;
