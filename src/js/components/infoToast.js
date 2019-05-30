// @flow

import * as React from 'react';
import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';

type Props = {
  handleHeadingClick: () => void,
};

type State = {
  isOpen: boolean,
};
class InfoToast extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { isOpen: true };
  }

  render() {
    return (
      <>
        {this.state.isOpen ? (
          <ToastContainer>
            <Toast
              labels={{
                heading: 'This is not the most recent version of this product.',
                headingLink: 'Switch to the most recent version.',
              }}
              onClickHeadingLink={this.props.handleHeadingClick}
              onRequestClose={() => this.setState({ isOpen: false })}
            />
          </ToastContainer>
        ) : null}
      </>
    );
  }
}

export default InfoToast;
