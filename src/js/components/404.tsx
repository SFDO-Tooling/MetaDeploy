import Illustration from '@salesforce/design-system-react/components/illustration';
import i18n from 'i18next';
import svgPath from 'images/desert.svg';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import Header from '@/components/header';
import routes from '@/utils/routes';

export const EmptyIllustration = ({
  message,
}: {
  message: React.ReactNode;
}) => (
  <Illustration
    heading="¯\_(ツ)_/¯"
    messageBody={message}
    name="Desert"
    path={`${svgPath}#desert`}
    size="large"
  />
);

const FourOhFour = ({
  message,
  history,
}: {
  message?: React.ReactNode;
} & RouteComponentProps) => (
  <DocumentTitle title={`${i18n.t('404')} | ${window.SITE_NAME}`}>
    <>
      <Header history={history} />
      <EmptyIllustration
        message={
          message === undefined ? (
            <Trans i18nKey="pageCannotBeFound">
              That page cannot be found. Try the{' '}
              <Link to={routes.home()}>home page</Link>?
            </Trans>
          ) : (
            message
          )
        }
      />
    </>
  </DocumentTitle>
);

export default withRouter(FourOhFour);
