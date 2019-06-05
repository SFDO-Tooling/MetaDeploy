// @flow

import * as React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { t } from 'i18next';

import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';

type Props = {
  link: string,
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
    const { link } = this.props;
    const { isOpen } = this.state;
    return (
      <>
        {isOpen ? (
          <ToastContainer>
            <Toast
              labels={{
                heading: [
                  t('This is not the most recent version of this product.'),
                  <Link key="version-link " to={link}>
                    {t('Switch to the most recent version.')}
                  </Link>,
                ],
              }}
              onRequestClose={() => this.setState({ isOpen: false })}
            />
          </ToastContainer>
        ) : null}
      </>
    );
  }
}

export default withRouter(InfoToast);
