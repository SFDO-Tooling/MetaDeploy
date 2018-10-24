// @flow

import * as React from 'react';
import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';

import type { Preflight as PreflightType } from 'plans/reducer';

type Props = {
  preflight: PreflightType,
};

type State = {
  isOpen: boolean,
};

class Toasts extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { isOpen: false };
  }

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  getToast(): React.Node {
    const { preflight } = this.props;
    if (preflight.status === 'failed') {
      return (
        <Toast
          labels={{
            heading: ['Pre-install validation has failed.'],
          }}
          variant="error"
          duration={20 * 1000}
          onRequestClose={this.handleClose}
        />
      );
    }
    if (preflight.status !== 'complete') {
      return null;
    }
    if (preflight.has_errors) {
      return (
        <Toast
          labels={{
            heading: ['Pre-install validation has completed with errors.'],
          }}
          variant="error"
          duration={20 * 1000}
          onRequestClose={this.handleClose}
        />
      );
    }
    return (
      <Toast
        labels={{
          heading: ['Pre-install validation has completed successfully.'],
        }}
        variant="success"
        duration={20 * 1000}
        onRequestClose={this.handleClose}
      />
    );
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    const { preflight } = props;
    // Only show toasts if the preflight status was 'started' at some point.
    if (preflight.status === 'started' && !state.isOpen) {
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
