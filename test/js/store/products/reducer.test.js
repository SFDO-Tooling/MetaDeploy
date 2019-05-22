import reducer from 'store/products/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = [];
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PRODUCTS_SUCCEEDED action', () => {
    const product1 = {
      id: 'p1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
    };
    const product2 = {
      id: 'p2',
      title: 'Product 2',
      description: 'This is another test product.',
      category: 'salesforce',
    };
    const expected = [product2];
    const actual = reducer([product1], {
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PRODUCTS_FAILED action', () => {
    const product = {
      id: 'p1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
    };
    const expected = [];
    const actual = reducer([product], {
      type: 'FETCH_PRODUCTS_FAILED',
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_VERSION_SUCCEEDED action', () => {
    const product1 = {
      id: 'p1',
      title: 'Product 1',
    };
    const product2 = {
      id: 'p2',
      title: 'Product 2',
    };
    const version = {
      id: 'v1',
      label: 'A Version',
    };
    const modifiedProduct2 = {
      ...product2,
      versions: { [version.label]: version },
    };
    const expected = [product1, modifiedProduct2];
    const actual = reducer([product1, product2], {
      type: 'FETCH_VERSION_SUCCEEDED',
      payload: { product: 'p2', label: version.label, version },
    });

    expect(actual).toEqual(expected);
  });

  describe('FETCH_PLANS_SUCCEEDED', () => {
    test('saves plans on most_recent_version', () => {
      const version = 'v1';
      const product = 'p1';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const additional_plans = {
        'my-plan': plans[0],
        'old-slug': plans[0],
      };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const afterProduct = {
        ...beforeProduct,
        most_recent_version: {
          ...beforeProduct.most_recent_version,
          additional_plans,
          fetched_additional_plans: true,
        },
      };
      const expected = [afterProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { product, version, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('saves plans on other version', () => {
      const version = 'v1';
      const product = 'p1';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const additional_plans = {
        'my-plan': plans[0],
        'old-slug': plans[0],
      };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: null,
        versions: {
          'version-1': { id: 'v1', label: 'version-1' },
        },
      };
      const afterProduct = {
        ...beforeProduct,
        versions: {
          'version-1': {
            ...beforeProduct.versions['version-1'],
            additional_plans,
            fetched_additional_plans: true,
          },
        },
      };
      const expected = [afterProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { product, version, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no product matches', () => {
      const version = 'v1';
      const product = 'other-product';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { product, version, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [no versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { product, version, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [has versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: null,
        versions: {
          'version-1': { id: 'v1', label: 'version-1' },
        },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLANS_SUCCEEDED',
        payload: { product, version, plans },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_PLAN_SUCCEEDED', () => {
    test('saves plan on most_recent_version', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const additional_plans = {
        'my-plan': plans[0],
        'old-slug': plans[0],
      };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const afterProduct = {
        ...beforeProduct,
        most_recent_version: {
          ...beforeProduct.most_recent_version,
          additional_plans,
        },
      };
      const expected = [afterProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('saves plan on other version', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const existingPlan = { id: 'plan-2', slug: 'other-plan' };
      const additional_plans = {
        'other-plan': existingPlan,
        'my-plan': plans[0],
        'old-slug': plans[0],
      };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: null,
        versions: {
          'version-1': {
            id: 'v1',
            label: 'version-1',
            additional_plans: { 'other-plan': existingPlan },
          },
        },
      };
      const afterProduct = {
        ...beforeProduct,
        versions: {
          'version-1': {
            ...beforeProduct.versions['version-1'],
            additional_plans,
          },
        },
      };
      const expected = [afterProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('saves null if plan is not found', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
      const plans = [];
      const additional_plans = {
        'my-plan': null,
      };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const afterProduct = {
        ...beforeProduct,
        most_recent_version: {
          ...beforeProduct.most_recent_version,
          additional_plans,
        },
      };
      const expected = [afterProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no product matches', () => {
      const version = 'v1';
      const product = 'other-product';
      const slug = 'my-plan';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [no versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const slug = 'my-plan';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [has versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const slug = 'my-plan';
      const plans = [
        { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] },
      ];
      const beforeProduct = {
        id: 'p1',
        most_recent_version: null,
        versions: {
          'version-1': { id: 'v1', label: 'version-1' },
        },
      };
      const expected = [beforeProduct];
      const actual = reducer([beforeProduct], {
        type: 'FETCH_PLAN_SUCCEEDED',
        payload: { product, version, slug, plans },
      });

      expect(actual).toEqual(expected);
    });
  });
});
