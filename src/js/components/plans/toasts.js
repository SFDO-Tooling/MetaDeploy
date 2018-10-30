// @flow

import * as React from 'react';
import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';

import { CONSTANTS } from 'plans/reducer';

import type { Preflight as PreflightType } from 'plans/reducer';

type Props = {
  preflight: PreflightType,
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
          heading: [label],
        }}
        variant={variant}
        duration={20 * 1000}
        onRequestClose={this.handleClose}
      />
    );
  }

  getToast(): React.Node | null {
    const { preflight } = this.props;
    if (preflight.status === STATUS.FAILED) {
      return this.getToastComponent('Pre-install validation has failed.');
    }
    if (preflight.status !== STATUS.COMPLETE) {
      return null;
    }
    const hasErrors =
      preflight.error_count !== undefined && preflight.error_count > 0;
    if (hasErrors) {
      return this.getToastComponent(
        'Pre-install validation completed with errors.',
      );
    }
    const hasWarnings =
      preflight.warning_count !== undefined && preflight.warning_count > 0;
    if (hasWarnings) {
      return this.getToastComponent(
        'Pre-install validation completed with warnings.',
        'warning',
      );
    }
    return this.getToastComponent(
      'Pre-install validation completed successfully.',
      'success',
    );
  }

  // Using this is often discouraged, but we only want to show toasts if the
  // preflight is *changing* from `started` to `complete` or `failed` -- we use
  // this to show the Toast only once we've seen the preflight is `started`.
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  static getDerivedStateFromProps(props: Props, state: State) {
    const { preflight } = props;
    // Only show toasts if the preflight status was `started` at some point.
    if (preflight.status === STATUS.STARTED && !state.isOpen) {
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
