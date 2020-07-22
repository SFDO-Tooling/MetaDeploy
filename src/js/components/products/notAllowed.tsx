import i18n from 'i18next';
import * as React from 'react';

import svgPath from '!svg-inline-loader!images/no-access.svg';
import Login from '@/components/header/login';

const NotAllowed = ({
  isLoggedIn,
  message,
  link,
}: {
  isLoggedIn: boolean;
  message: string | null;
  link: React.ReactNode;
}) => (
  <>
    <div className="slds-illustration slds-illustration_large">
      <div
        className="slds-m-vertical_xx-large"
        dangerouslySetInnerHTML={{ __html: svgPath }}
      />
      <h3 className="slds-illustration__header slds-text-heading_medium">
        {i18n.t('Restricted Access')}
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
        {link} {i18n.t('or')}{' '}
      </div>
      <Login
        id="product-not-allowed-login"
        label={
          isLoggedIn ? i18n.t('log in with a different org') : i18n.t('log in')
        }
        buttonClassName="slds-p-horizontal_xxx-small"
        buttonVariant="base"
      />
    </div>
  </>
);

export default NotAllowed;
