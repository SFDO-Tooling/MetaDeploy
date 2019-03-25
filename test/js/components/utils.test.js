import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import routes from 'utils/routes';
import { getLoadingOrNotFound, shouldFetchVersion } from 'components/utils';

const defaultProduct = {
  id: 'p1',
  slug: 'product-1',
  title: 'Product 1',
  description: 'This is a test product.',
  category: 'salesforce',
  image: null,
  most_recent_version: {
    id: 'v1',
    product: 'p1',
    label: '1.0.0',
    description: 'This is a test product version.',
    primary_plan: {
      id: 'plan-1',
      slug: 'my-plan',
      title: 'My Plan',
    },
    secondary_plan: null,
    additional_plans: [],
  },
};

describe('shouldFetchVersion', () => {
  describe('no product', () => {
    test('return false', () => {
      const actual = shouldFetchVersion({ product: null });

      expect(actual).toBe(false);
    });
  });

  describe('no version, already fetched', () => {
    test('returns false', () => {
      const product = {
        ...defaultProduct,
        versions: { '2.0.0': null },
      };
      const actual = shouldFetchVersion({
        product,
        version: null,
        versionLabel: '2.0.0',
      });

      expect(actual).toBe(false);
    });
  });

  describe('version not yet fetched', () => {
    test('returns true', () => {
      const product = {
        ...defaultProduct,
        versions: { '2.0.0': 'not null' },
      };
      const actual = shouldFetchVersion({
        product,
        version: null,
        versionLabel: '2.0.0',
      });

      expect(actual).toBe(true);
    });
  });
});

describe('getLoadingOrNotFound', () => {
  const setup = opts => {
    const context = {};
    const { getByText } = render(
      <StaticRouter context={context}>
        {getLoadingOrNotFound(opts)}
      </StaticRouter>,
    );
    return { getByText, context };
  };

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ product: null });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('plan slug but no plan', () => {
    test('redirects to plan_detail', () => {
      const { context } = setup({
        product: defaultProduct,
        versionLabel: '1.0.0',
        planSlug: 'plan-1',
      });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'plan-1'),
      );
    });
  });

  describe('no version, already fetched', () => {
    test('renders <VersionNotFound />', () => {
      const product = {
        ...defaultProduct,
        versions: { '2.0.0': null },
      };
      const { getByText } = setup({
        product,
        version: null,
        versionLabel: '2.0.0',
      });

      expect(getByText('most recent version')).toBeVisible();
    });
  });

  describe('version not yet fetched', () => {
    test('renders <Spinner />', () => {
      const product = {
        ...defaultProduct,
        versions: { '2.0.0': 'not null' },
      };
      const { getByText } = setup({
        product,
        version: null,
        versionLabel: '2.0.0',
      });

      expect(getByText('Loading...')).toBeVisible();
    });
  });

  describe('no plan', () => {
    test('renders <PlanNotFound />', () => {
      const { getByText } = setup({
        product: defaultProduct,
        version: defaultProduct.most_recent_version,
        plan: null,
      });

      expect(getByText('another plan')).toBeVisible();
    });

    describe('no version', () => {
      test('renders <VersionNotFound />', () => {
        const { getByText } = setup({
          product: defaultProduct,
          plan: null,
        });

        expect(getByText('most recent version')).toBeVisible();
      });
    });
  });

  describe('jobId but no job', () => {
    test('renders <JobNotFound />', () => {
      const { getByText } = setup({
        product: defaultProduct,
        version: defaultProduct.most_recent_version,
        plan: defaultProduct.most_recent_version.primary_plan,
        jobId: 'job-1',
        job: null,
      });

      expect(getByText('starting a new installation')).toBeVisible();
    });

    describe('unknown job', () => {
      test('renders <Spinner />', () => {
        const { getByText } = setup({
          product: defaultProduct,
          version: defaultProduct.most_recent_version,
          plan: defaultProduct.most_recent_version.primary_plan,
          jobId: 'job-1',
        });

        expect(getByText('Loading...')).toBeVisible();
      });
    });
  });
});
