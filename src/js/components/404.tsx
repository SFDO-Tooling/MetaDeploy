import i18n from 'i18next';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';

import desertSvg from '!svg-inline-loader!images/desert.svg';
import Header from '@/components/header';
import routes from '@/utils/routes';

export const EmptyIllustration = ({
  message,
}: {
  message: React.ReactNode;
}) => (
  <div className="slds-illustration slds-illustration_large">
    <div
      className="slds-m-vertical_xx-large"
      dangerouslySetInnerHTML={{ __html: desertSvg }}
    />
    <h3 className="slds-illustration__header slds-text-heading_medium">
      ¯\_(ツ)_/¯
    </h3>
    <p className="slds-text-body_regular">{message}</p>
  </div>
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
