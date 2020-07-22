import Illustration from '@salesforce/design-system-react/components/illustration';
import i18n from 'i18next';
import svgPath from 'images/no-access.svg';
import * as React from 'react';

import Login from '@/components/header/login';

const NotAllowed = ({
  isLoggedIn,
  message,
  link,
}: {
  isLoggedIn: boolean;
  message: string | null;
  link: React.Node;
}) => (
  <>
    <Illustration
      heading={i18n.t('Restricted Access')}
      name="No Access"
      path={`${svgPath}#no-access`}
      size="large"
    />
    {message ? (
      <div className="slds-align_absolute-center slds-size_2-of-3">
        <div
          className="slds-text-longform
            slds-text-body_regular
            markdown"
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
