import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import CtaButton from '@/js/components/jobs/ctaButton';

import { render } from './../../utils';

const defaultJob = {
  id: 'job-1',
  status: 'complete',
  instance_url: '/my/org/',
};

describe('<CtaButton />', () => {
  const setup = (options) => {
    const defaults = {
      job: defaultJob,
      canceling: false,
      linkToPlan: '/my/plan/',
      preflightRequired: true,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container } = render(
      <MemoryRouter>
        <CtaButton {...opts} />
      </MemoryRouter>,
    );
    return { getByText, container };
  };

  describe('started job', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({ job: { status: 'started' } });

      expect(getByText('Installation In Progress…')).toBeVisible();
    });
  });

  describe('canceling job', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({
        job: { status: 'started' },
        canceling: true,
      });

      expect(getByText('Canceling Installation…')).toBeVisible();
    });
  });

  describe('complete job', () => {
    test('renders view org btn', () => {
      const { getByText } = setup();

      expect(getByText('View Org')).toBeVisible();
    });

    describe('no org', () => {
      test('renders nothing', () => {
        const { container } = setup({
          job: { ...defaultJob, instance_url: null },
        });

        expect(container.children).toHaveLength(0);
      });
    });
  });

  describe('failed job', () => {
    test('renders return to preflight btn', () => {
      const { getByText } = setup({ job: { status: 'failed' } });

      expect(getByText('Return to Pre-Install Validation')).toBeVisible();
    });
  });

  describe('canceled job', () => {
    test('renders return to preflight btn', () => {
      const { getByText } = setup({ job: { status: 'canceled' } });

      expect(getByText('Return to Pre-Install Validation')).toBeVisible();
    });
  });

  describe('unknown job status', () => {
    test('renders nothing', () => {
      const { container } = setup({ job: { status: 'foo' } });

      expect(container.children).toHaveLength(0);
    });
  });
});
