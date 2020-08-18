import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import i18n from 'i18next';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

type Props = {
  link: string;
} & RouteComponentProps;

type State = {
  isOpen: boolean;
};

class OldVersionWarning extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { isOpen: true };
  }

  closeToast = () => {
    this.setState({ isOpen: false });
  };

  linkClicked = () => {
    const { history, link } = this.props;
    history.push(link);
  };

  render() {
    const { isOpen } = this.state;
    return (
      <>
        {isOpen ? (
          <ToastContainer>
            <Toast
              labels={{
                heading: i18n.t(
                  'This is not the most recent version of this product.',
                ),
                headingLink: i18n.t('Go to the most recent version.'),
              }}
              variant="warning"
              onClickHeadingLink={this.linkClicked}
              onRequestClose={this.closeToast}
            />
          </ToastContainer>
        ) : null}
      </>
    );
  }
}

export default withRouter(OldVersionWarning);
