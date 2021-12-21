import { t } from 'i18next';
import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import Login from '@/js/components/header/login';

const JobNotFound = ({
  url,
  isLoggedIn,
}: {
  url: string;
  isLoggedIn?: boolean;
}) => (
  <>
    <FourOhFour
      message={
        <Trans i18nKey="installationNotFound">
          We can’t find the installation you’re looking for. Try{' '}
          <Link to={url}>starting a new installation</Link>?
        </Trans>
      }
    />
    <div className="slds-align_absolute-center">
      <Login
        id="job-404-login"
        label={isLoggedIn ? t('Log In With a Different Org') : t('Log In')}
        buttonClassName="slds-p-horizontal_xxx-small"
        buttonVariant="base"
      />
    </div>
  </>
);

export default JobNotFound;
