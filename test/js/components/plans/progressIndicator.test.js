import React from 'react';

import ProgressIndicator from '@/js/components/plans/progressIndicator';

import { render } from './../../utils';

describe('<ProgressIndicator />', () => {
  const setup = (options) => {
    const defaults = {
      userLoggedIn: true,
      scratchOrgCreated: false,
      preflightStatus: null,
      preflightIsValid: false,
      preflightIsReady: false,
      supportedOrgs: 'Persistent',
      preflightRequired: true,
    };
    const opts = { ...defaults, ...options };
    const { getByText } = render(<ProgressIndicator {...opts} />);
    return { getByText };
  };

  describe('not logged in', () => {
    test('shows no steps complete', () => {
      const { getByText } = setup({
        userLoggedIn: false,
      });

      expect(getByText('Step 1: Log in')).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('logged in, no preflight', () => {
    test('shows first step complete', () => {
      const { getByText } = setup();

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('preflight started', () => {
    test('shows first step complete', () => {
      const { getByText } = setup({
        preflightStatus: 'started',
        preflightIsValid: true,
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('preflight invalid', () => {
    test('shows first step complete', () => {
      const { getByText } = setup({
        preflightStatus: 'complete',
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('preflight complete and is_ready', () => {
    test('shows all steps complete', () => {
      const { getByText } = setup({
        preflightStatus: 'complete',
        preflightIsValid: true,
        preflightIsReady: true,
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Completed'),
      ).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('preflight complete with errors', () => {
    test('shows error step', () => {
      const { getByText } = setup({
        preflightStatus: 'complete',
        preflightIsValid: true,
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Error'),
      ).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('only scratch orgs supported', () => {
    test('shows "Create Scratch Org" as first step', () => {
      const { getByText } = setup({
        supportedOrgs: 'Scratch',
      });

      expect(getByText('Step 1: Create Scratch Org')).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('both scratch orgs and persistent orgs supported', () => {
    test('shows both options as first step', () => {
      const { getByText } = setup({
        userLoggedIn: false,
        scratchOrgCreated: true,
        supportedOrgs: 'Both',
      });

      expect(
        getByText('Step 1: Log In or Create Scratch Org - Completed'),
      ).toBeVisible();
      expect(getByText('Step 2: Run pre-install validation')).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('Preflight Not required', () => {
    test('Do not show pre-install step', () => {
      const { getByText } = setup({
        preflightRequired: false,
        userLoggedIn: false,
      });

      expect(getByText('Step 1: Log in')).toBeVisible();
      expect(getByText('Step 2: Install')).toBeVisible();
    });
  });
});
