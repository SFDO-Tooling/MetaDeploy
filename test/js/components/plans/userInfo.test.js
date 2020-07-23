import React from 'react';
import { render } from '@testing-library/react';

import UserInfo from 'components/plans/userInfo';

const defaultUser = {
  username: 'Test User',
  org_name: 'Test Org',
  org_type: 'Test Edition',
  valid_token_for: 'my_token',
};

describe('<UserInfo />', () => {
  const setup = (options) => {
    const defaults = {
      user: defaultUser,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container } = render(<UserInfo user={opts.user} />);
    return { getByText, container };
  };

  describe('no user', () => {
    test('renders empty message', () => {
      const { getByText } = setup({ user: null });

      expect(getByText('Not Connected to Salesforce')).toBeVisible();
    });
  });

  describe('user has no token', () => {
    test('renders empty message', () => {
      const { getByText } = setup({ user: { valid_token_for: null } });

      expect(getByText('Not Connected to Salesforce')).toBeVisible();
    });
  });

  describe('valid token', () => {
    test('renders user/org info', () => {
      const { getByText } = setup();

      expect(getByText('Connected to Salesforce')).toBeVisible();
      expect(getByText('Test User')).toBeVisible();
      expect(getByText('Test Org')).toBeVisible();
      expect(getByText('Test Edition')).toBeVisible();
      expect(getByText('log in with a different org')).toBeVisible();
    });
  });
});
