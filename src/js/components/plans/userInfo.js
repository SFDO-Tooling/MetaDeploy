// @flow

import * as React from 'react';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import Illustration from '@salesforce/design-system-react/components/illustration';
import { Trans } from 'react-i18next';
import i18n from 'i18n';

import Login from 'components/header/login';

import svgPath from 'images/no-connection.svg';

import type { User as UserType } from 'user/reducer';

const LoggedOut = (): React.Node => (
  <Illustration
    heading={i18n.t('Not Connected to Salesforce')}
    name={i18n.t('No Connection')}
    path={`${svgPath}#no-connection`}
    style={{ height: '200px' }}
  />
);

const Footer = (): React.Node => (
  <Trans i18nKey="isThisCorrectOrg">
    Is this the correct org? If not, please{' '}
    <Login
      id="user-info-login"
      label={i18n.t('log in with a different org')}
      buttonClassName="slds-p-horizontal_xxx-small"
      buttonVariant="base"
    />
  </Trans>
);

const UserInfo = ({ user }: { user: UserType }): React.Node => {
  const hasValidToken = user && user.valid_token_for !== null;
  return (
    <div
      className="slds-p-around_medium
        slds-size_1-of-1
        slds-medium-size_1-of-2"
    >
      <Card
        bodyClassName="slds-card__body_inner"
        heading={hasValidToken ? i18n.t('Connected to Salesforce') : ''}
        icon={
          hasValidToken ? (
            <Icon category="utility" name="connected_apps" />
          ) : null
        }
        empty={hasValidToken ? null : <LoggedOut />}
        footer={hasValidToken ? <Footer /> : null}
      >
        <ul>
          {user && user.username ? (
            <li>
              <Trans i18nKey="username">
                <strong>User:</strong> {user.username}
              </Trans>
            </li>
          ) : null}
          {user && user.org_name ? (
            <li>
              <Trans i18nKey="orgname">
                <strong>Org:</strong> {user.org_name}
              </Trans>
            </li>
          ) : null}
          {user && user.org_type ? (
            <li>
              <Trans i18nKey="orgtype">
                <strong>Type:</strong> {user.org_type}
              </Trans>
            </li>
          ) : null}
        </ul>
        <p className="slds-p-top_small">
          <Trans i18nKey="credentialsHoldTime">
            The credentials to your Salesforce org will only be held for
            {` ${window.GLOBALS.TOKEN_LIFETIME_MINUTES || 10} `}
            minutes or until your requested installation is complete.
          </Trans>
        </p>
      </Card>
    </div>
  );
};

export default UserInfo;
