import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';

import svgPath from '@/img/no-access.svg?raw';
import Login from '@/js/components/header/login';

// No-op wrapper because `Trans` components can contain other components,
// but cannot contain nodes as dynamic content.
const NotAllowedLink = ({ link }: { link: JSX.Element }) => link;

const NotAllowed = ({
  isLoggedIn,
  message,
  link,
}: {
  isLoggedIn: boolean;
  message: string | null;
  link: JSX.Element;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="slds-illustration slds-illustration_large">
        <div
          className="slds-m-vertical_xx-large"
          dangerouslySetInnerHTML={{ __html: svgPath }}
        />
        <h3 className="slds-illustration__header slds-text-heading_medium">
          {t('Restricted Access')}
        </h3>
      </div>
      {message ? (
        <div className="slds-align_absolute-center slds-size_2-of-3">
          <div
            className="slds-text-longform slds-text-body_regular markdown"
            // This message is pre-cleaned by the API
            dangerouslySetInnerHTML={{
              __html: message,
            }}
          />
        </div>
      ) : null}
      <div className="slds-align_absolute-center">
        <div className="slds-text-longform slds-text-body_regular">
          <Trans i18nKey="a_or_b">
            <NotAllowedLink link={link} />
            {' or '}
            <Login
              id="product-not-allowed-login"
              label={
                isLoggedIn ? t('log in with a different org') : t('log in')
              }
              buttonClassName="slds-p-horizontal_xxx-small"
              buttonVariant="base"
            />
          </Trans>
        </div>
      </div>
    </>
  );
};

export default NotAllowed;
