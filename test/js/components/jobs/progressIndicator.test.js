import React from 'react';

import ProgressIndicator from '@/js/components/jobs/progressIndicator';

import { render } from './../../utils';

const defaultJob = {
  id: 'job-1',
  creator: {
    username: 'test-user',
  },
  plan: 'plan-1',
  status: 'started',
  steps: ['step-1', 'step-2', 'step-3'],
  results: { 'step-1': [{ status: 'ok' }] },
  org_name: 'Test Org',
  org_type: null,
  error_count: 0,
};

describe('<ProgressIndicator />', () => {
  const setup = (options) => {
    const defaults = {
      job: defaultJob,
      preflightRequired: true,
    };
    const opts = { ...defaults, ...options };
    const { getByText } = render(<ProgressIndicator {...opts} />);
    return { getByText };
  };

  describe('started', () => {
    test('shows two steps complete', () => {
      const { getByText } = setup();

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Completed'),
      ).toBeVisible();
      expect(getByText('Step 3: Install')).toBeVisible();
    });
  });

  describe('complete', () => {
    test('shows all steps complete', () => {
      const { getByText } = setup({
        job: { ...defaultJob, status: 'complete' },
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Completed'),
      ).toBeVisible();
      expect(getByText('Step 3: Install - Completed')).toBeVisible();
    });
  });

  describe('failed', () => {
    test('shows final step error', () => {
      const { getByText } = setup({ job: { ...defaultJob, status: 'failed' } });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Completed'),
      ).toBeVisible();
      expect(getByText('Step 3: Install - Error')).toBeVisible();
    });
  });

  describe('canceled', () => {
    test('shows final step error', () => {
      const { getByText } = setup({
        job: { ...defaultJob, status: 'canceled' },
      });

      expect(getByText('Step 1: Log in - Completed')).toBeVisible();
      expect(
        getByText('Step 2: Run pre-install validation - Completed'),
      ).toBeVisible();
      expect(getByText('Step 3: Install - Error')).toBeVisible();
    });
  });
});
