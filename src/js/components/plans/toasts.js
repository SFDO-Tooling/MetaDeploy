// @flow

import * as React from 'react';
import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import * as i18n from 'i18next';

import { CONSTANTS } from 'plans/reducer';

import type { Job as JobType } from 'jobs/reducer';
import type { Preflight as PreflightType } from 'plans/reducer';

type Props = {
  job?: JobType,
  preflight?: PreflightType,
  label: string,
};

type State = {
  isOpen: boolean,
};

const { STATUS } = CONSTANTS;

class Toasts extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { isOpen: false };
  }

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  getToastComponent(label: string, variant: string = 'error'): React.Node {
    return (
      <Toast
        labels={{
          heading: [i18n.t(label)],
        }}
        variant={variant}
        duration={20 * 1000}
        onRequestClose={this.handleClose}
      />
    );
  }

  getToast(): React.Node | null {
    const { job, preflight, label } = this.props;
    const model = job || preflight;
    /* istanbul ignore if */
    if (!model) {
      return null;
    }
    if (
      model.status === STATUS.FAILED ||
      (preflight && model.status === STATUS.CANCELED)
    ) {
      return this.getToastComponent(`${label} has failed.`);
    }
    if (model.status === STATUS.CANCELED) {
      return this.getToastComponent(`${label} has been canceled.`);
    }
    if (model.status !== STATUS.COMPLETE) {
      return null;
    }
    const hasErrors = model.error_count !== undefined && model.error_count > 0;
    if (hasErrors) {
      return this.getToastComponent(`${label} completed with errors.`);
    }
    const hasWarnings =
      model.warning_count !== undefined && model.warning_count > 0;
    if (hasWarnings) {
      return this.getToastComponent(
        `${label} completed with warnings.`,
        'warning',
      );
    }
    return this.getToastComponent(
      `${label} completed successfully.`,
      'success',
    );
  }

  // Using this is often discouraged, but we only want to show toasts if the
  // preflight/job is *changing* from `started` to `complete` or `failed` -- we
  // use this to show the Toast only once we've seen the status is `started`.
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(props: Props, state: State) {
    const { job, preflight } = props;
    const model = job || preflight;
    /* istanbul ignore if */
    if (!model) {
      return null;
    }
    // Only show toasts if the status was `started` at some point.
    if (model.status === STATUS.STARTED && !state.isOpen) {
      return { isOpen: true };
    }
    return null;
  }

  render(): React.Node {
    const { isOpen } = this.state;
    return <ToastContainer>{isOpen ? this.getToast() : null}</ToastContainer>;
  }
}

export default Toasts;
