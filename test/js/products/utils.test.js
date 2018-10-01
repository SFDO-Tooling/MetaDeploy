import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import { gatekeeper } from 'products/utils';

describe('gatekeeper', () => {
  const setup = opts => {
    const { getByText } = render(
      <MemoryRouter>{gatekeeper(opts)}</MemoryRouter>,
    );
    return { getByText };
  };

  const defaultProduct = {
    id: 1,
    slug: 'product-1',
    title: 'Product 1',
    description: 'This is a test product.',
    category: 'salesforce',
    image: null,
    most_recent_version: {
      id: 1,
      product: 1,
      label: '1.0.0',
      description: 'This is a test product version.',
      primary_plan: {
        id: 1,
        slug: 'my-plan',
        title: 'My Plan',
      },
      secondary_plan: null,
      additional_plans: [],
    },
  };

  describe('no product', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText } = setup({ product: null });

      expect(getByText('list of all products')).toBeVisible();
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
    test('renders <Spinner /> while fetching', () => {
      const product = {
        ...defaultProduct,
        versions: { '2.0.0': 'not null' },
      };
      const doFetchVersion = jest.fn();
      const { getByText } = setup({
        product,
        version: null,
        versionLabel: '2.0.0',
        doFetchVersion,
      });

      expect(getByText('Loading...')).toBeVisible();
      expect(doFetchVersion).toHaveBeenCalled();
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
});
