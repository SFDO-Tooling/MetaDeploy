// @flow

import * as React from 'react';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import Illustration from '@salesforce/design-system-react/components/illustration';

import Login from 'components/header/login';

import svgPath from 'images/no-connection.svg';

import type { User as UserType } from 'accounts/reducer';

const LoggedOut = (): React.Node => (
  <Illustration
    heading="Not Connected to Salesforce"
    name="No Connection"
    path={`${svgPath}#no-connection`}
    style={{ height: '200px' }}
  />
);

const Footer = (): React.Node => (
  <>
    Is this the correct org? If not, please{' '}
    <Login
      id="user-info-login"
      label="log in with a different org"
      buttonClassName="slds-p-horizontal_xxx-small"
      buttonVariant="base"
    />
  </>
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
        heading={hasValidToken ? 'Connected to Salesforce' : ''}
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
              <strong>User:</strong> {user.username}
            </li>
          ) : null}
          {user && user.org_name ? (
            <li>
              <strong>Org:</strong> {user.org_name}
            </li>
          ) : null}
          {user && user.org_type ? (
            <li>
              <strong>Type:</strong> {user.org_type}
            </li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
};

export default UserInfo;
