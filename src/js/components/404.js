// @flow

import * as React from 'react';
import DocumentTitle from 'react-document-title';
import Illustration from '@salesforce/design-system-react/components/illustration';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import type { RouterHistory } from 'react-router-dom';

import Header from 'components/header';
import routes from 'utils/routes';
import svgPath from 'images/desert.svg';

export const EmptyIllustration = ({ message }: { message: React.Node }) => (
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
  message?: React.Node,
  history?: RouterHistory,
}) => (
  <DocumentTitle title={`${t('404')} | ${window.SITE_NAME}`}>
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

export default FourOhFour;
