import React from 'react';
import { StaticRouter } from 'react-router-dom';

import {
  getLoadingOrNotFound,
  shouldFetchPlan,
  shouldFetchVersion,
} from '@/js/components/utils';
import { LATEST_VERSION } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

import { renderWithRedux } from './../utils';

const defaultProduct = {
  id: 'p1',
  slug: 'product-1',
  old_slugs: ['old-product'],
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
      old_slugs: ['old-plan'],
      title: 'My Plan',
    },
    secondary_plan: null,
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

describe('shouldFetchPlan', () => {
  describe('no version', () => {
    test('return false', () => {
      const actual = shouldFetchPlan({ version: null });

      expect(actual).toBe(false);
    });
  });

  describe('no plan, already fetched', () => {
    test('returns false', () => {
      const version = {
        ...defaultProduct.most_recent_version,
        additional_plans: { 'my-plan': null },
      };
      const actual = shouldFetchPlan({
        version,
        plan: null,
        planSlug: 'my-plan',
      });

      expect(actual).toBe(false);
    });
  });

  describe('version not yet fetched', () => {
    test('returns true', () => {
      const version = {
        ...defaultProduct.most_recent_version,
        additional_plans: { 'my-plan': {} },
      };
      const actual = shouldFetchPlan({
        version,
        plan: null,
        planSlug: 'my-plan',
      });

      expect(actual).toBe(true);
    });
  });
});

describe('getLoadingOrNotFound', () => {
  const setup = (opts) => {
    const context = {};
    const { getByText } = renderWithRedux(
      <StaticRouter context={context}>
        {getLoadingOrNotFound(opts)}
      </StaticRouter>,
    );
    return { getByText, context };
  };

  describe('unknown product', () => {
    test('renders spinner', () => {
      const { getByText } = setup({
        product: undefined,
        productSlug: 'other-product',
      });

      expect(getByText('Loading...')).toBeVisible();
    });
  });

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ product: null });

      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('maybeVersion and maybeSlug', () => {
    test('renders spinner', () => {
      const { getByText } = setup({
        product: defaultProduct,
        maybeVersion: '1.0.0',
        maybeSlug: 'another-plan',
      });

      expect(getByText('Loading...')).toBeVisible();
    });
  });

  describe('plan slug but no plan', () => {
    test('redirects to plan_detail', () => {
      const { context } = setup({
        product: defaultProduct,
        versionLabel: '1.0.0',
        planSlug: 'plan-1',
      });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', LATEST_VERSION, 'plan-1'),
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
    test('renders <Spinner />', () => {
      const { getByText } = setup({
        product: defaultProduct,
        version: defaultProduct.most_recent_version,
        plan: null,
        planSlug: 'my-plan',
      });

      expect(getByText('Loading...')).toBeVisible();
    });

    describe('already fetched', () => {
      test('renders <PlanNotFound />', () => {
        const version = {
          ...defaultProduct.most_recent_version,
          additional_plans: { 'my-plan': null },
        };
        const { getByText } = setup({
          product: defaultProduct,
          version,
          plan: null,
          planSlug: 'my-plan',
        });

        expect(getByText('another plan')).toBeVisible();
      });
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

  describe('product has old_slug', () => {
    test('redirects to product_detail with new slug', () => {
      const { context } = setup({
        product: defaultProduct,
        productSlug: 'old-product',
        route: 'product_detail',
      });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(routes.product_detail('product-1'));
    });
  });

  describe('plan has old_slug', () => {
    test('redirects to route with new slug', () => {
      const { context } = setup({
        product: defaultProduct,
        productSlug: 'product-1',
        version: defaultProduct.most_recent_version,
        plan: defaultProduct.most_recent_version.primary_plan,
        planSlug: 'old-plan',
        route: 'plan_detail',
      });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'my-plan'),
      );
    });
  });

  describe('product and plan have old_slugs', () => {
    test('redirects to route with new slugs', () => {
      const { context } = setup({
        product: defaultProduct,
        productSlug: 'old-product',
        version: defaultProduct.most_recent_version,
        plan: defaultProduct.most_recent_version.primary_plan,
        planSlug: 'old-plan',
        route: 'plan_detail',
      });

      expect(context.action).toBe('REPLACE');
      expect(context.url).toEqual(
        routes.plan_detail('product-1', '1.0.0', 'my-plan'),
      );
    });
  });
});
