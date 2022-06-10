import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import React, { Component } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router-dom';

type Props = {
  link: string;
} & RouteComponentProps &
  WithTranslation;

type State = {
  isOpen: boolean;
};

class OldVersionWarning extends Component<Props, State> {
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
    const { t } = this.props;
    const { isOpen } = this.state;
    return (
      <>
        {isOpen ? (
          <ToastContainer>
            <Toast
              labels={{
                heading: t(
                  'This is not the most recent version of this product.',
                ),
                headingLink: t('Go to the most recent version.'),
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

export default withRouter(withTranslation()(OldVersionWarning));
