// @flow

import * as React from 'react';

import routes from 'utils/routes';
import { logError } from 'utils/logging';

type Props = { children: React.Node };

class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /* istanbul ignore next */
  componentDidCatch(error: Error, info: {}) {
    this.setState({ hasError: true });
    logError(error, info);
  }

  render(): React.Node {
    if (this.state.hasError) {
      return (
        <div
          className="slds-text-longform
            slds-p-around_x-large"
        >
          <h1 className="slds-text-heading_large">Oh No!</h1>
          <p>
            An error occured. Try the <a href={routes.home()}>home page</a>?
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
