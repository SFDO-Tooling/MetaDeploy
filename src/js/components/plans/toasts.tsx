import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import { t } from 'i18next';
import * as React from 'react';

import { Job } from '@/js/store/jobs/reducer';
import { CONSTANTS, Preflight } from '@/js/store/plans/reducer';

type Props = {
  job?: Job;
  preflight?: Preflight;
  label: string;
};

type State = {
  isOpen: boolean;
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

  getToastComponent(label: string, variant = 'error') {
    return (
      <Toast
        labels={{
          heading: [t(label)],
        }}
        variant={variant}
        onRequestClose={this.handleClose}
      />
    );
  }

  getToast() {
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

  render() {
    const { isOpen } = this.state;
    return (
      <ToastContainer className="half-container">
        {isOpen ? this.getToast() : null}
      </ToastContainer>
    );
  }
}

export default Toasts;
