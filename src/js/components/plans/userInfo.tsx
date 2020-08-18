import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import * as React from 'react';
import { Trans } from 'react-i18next';

import noConnectionSvg from '!svg-inline-loader!images/no-connection.svg';
import Login from '@/components/header/login';
import { User } from '@/store/user/reducer';

const LoggedOut = () => (
  <div className="slds-illustration slds-illustration_small">
    <div
      className="slds-m-vertical_medium"
      dangerouslySetInnerHTML={{ __html: noConnectionSvg }}
    />
    <h3 className="slds-illustration__header slds-text-heading_medium">
      {i18n.t('Not Connected to Salesforce')}
    </h3>
  </div>
);

const Footer = () => (
  <>
    {i18n.t('Is this the correct org? If not, please')}{' '}
    <Login
      id="user-info-login"
      label={i18n.t('log in with a different org')}
      buttonClassName="slds-p-horizontal_xxx-small"
      buttonVariant="base"
    />
  </>
);

const UserInfo = ({ user }: { user: User }) => {
  const hasValidToken = Boolean(user?.valid_token_for);
  const username = user?.username;
  const org_name = user?.org_name;
  const org_type = user?.org_type;
  const token_minutes = window.GLOBALS.TOKEN_LIFETIME_MINUTES || 10;
  return (
    <div
      className="slds-p-around_medium
        slds-size_1-of-1
        slds-medium-size_1-of-2"
    >
      <Card
        bodyClassName="slds-card__body_inner"
        heading={i18n.t('Connected to Salesforce')}
        hasNoHeader={!hasValidToken}
        icon={<Icon category="utility" name="connected_apps" />}
        empty={hasValidToken ? null : <LoggedOut />}
        footer={hasValidToken ? <Footer /> : null}
      >
        <ul>
          {username ? (
            <li>
              <strong>{i18n.t('User:')}</strong> {username}
            </li>
          ) : null}
          {org_name ? (
            <li>
              <strong>{i18n.t('Org:')}</strong> {org_name}
            </li>
          ) : null}
          {org_type ? (
            <li>
              <strong>{i18n.t('Type:')}</strong> {org_type}
            </li>
          ) : null}
        </ul>
        <p className="slds-p-top_small">
          <Trans i18nKey="credentialsHoldTime" count={token_minutes}>
            The credentials to your Salesforce org will only be held for{' '}
            {{ token_minutes }} minutes or until your requested installation is
            complete.
          </Trans>
        </p>
      </Card>
    </div>
  );
};

export default UserInfo;
