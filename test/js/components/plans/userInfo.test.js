import React from 'react';

import UserInfo from '@/js/components/plans/userInfo';
import { SUPPORTED_ORGS } from '@/js/utils/constants';

import { render } from './../../utils';

const defaultUser = {
  username: 'Test User',
  org_name: 'Test Org',
  org_type: 'Test Edition',
  valid_token_for: 'my_token',
};

const defaultPlan = {
  supported_orgs: SUPPORTED_ORGS.Persistent,
};

describe('<UserInfo />', () => {
  const setup = (options) => {
    const defaults = {
      user: defaultUser,
      plan: defaultPlan,
    };
    const opts = { ...defaults, ...options };
    return render(<UserInfo {...opts} />);
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

  describe('scratch org plan', () => {
    beforeAll(() => {
      window.GLOBALS.SCRATCH_ORGS_AVAILABLE = true;
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders org expiration', () => {
      const { getByText, queryByText } = setup({
        user: null,
        plan: { supported_orgs: SUPPORTED_ORGS.Scratch },
        scratchOrg: { expires_at: new Date().toISOString() },
      });

      expect(queryByText('Connected to Salesforce')).toBeNull();
      expect(getByText('Scratch Org')).toBeVisible();
      expect(
        getByText('Your scratch org will expire on', { exact: false }),
      ).toBeVisible();
    });

    test('renders default expiration if no org', () => {
      const { getByText, queryByText } = setup({
        user: null,
        plan: {
          supported_orgs: SUPPORTED_ORGS.Scratch,
          scratch_org_duration: 5,
        },
        scratchOrg: null,
      });

      expect(queryByText('Connected to Salesforce')).toBeNull();
      expect(getByText('Scratch Org')).toBeVisible();
      expect(
        getByText('Your scratch org will expire after 5 days.'),
      ).toBeVisible();
    });

    test('renders nothing if logged in', () => {
      const { container } = setup({
        plan: { supported_orgs: SUPPORTED_ORGS.Scratch },
      });

      expect(container).toBeEmptyDOMElement();
    });

    test('renders nothing if no expiration info', () => {
      const { queryByText } = setup({
        user: null,
        plan: { supported_orgs: SUPPORTED_ORGS.Scratch },
        scratchOrg: null,
      });

      expect(queryByText('Connected to Salesforce')).toBeNull();
      expect(queryByText('Scratch Org')).toBeNull();
    });
  });
});
