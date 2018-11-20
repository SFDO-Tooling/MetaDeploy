import React from 'react';
import { render } from 'react-testing-library';

import CtaButton from 'components/jobs/ctaButton';

const defaultJob = {
  id: 'job-1',
  status: 'complete',
  organization_url: '/my/org/',
};

describe('<CtaButton />', () => {
  const setup = options => {
    const defaults = {
      job: defaultJob,
    };
    const opts = { ...defaults, ...options };
    const { getByText, container } = render(<CtaButton job={opts.job} />);
    return { getByText, container };
  };

  describe('started job', () => {
    test('renders progress btn', () => {
      const { getByText } = setup({ job: { status: 'started' } });

      expect(getByText('Installation In Progress...')).toBeVisible();
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
          job: { ...defaultJob, organization_url: null },
        });

        expect(container.children).toHaveLength(0);
      });
    });
  });

  describe('unknown job status', () => {
    test('renders nothing', () => {
      const { container } = setup({ job: { status: 'foo' } });

      expect(container.children).toHaveLength(0);
    });
  });
});
