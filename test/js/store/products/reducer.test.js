import reducer from '@/js/store/products/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = { products: [], notFound: [], categories: [] };
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
    const category = {
      id: 1,
      title: 'salesforce',
      next: null,
    };
    const expected = { products: [product2], categories: [category] };
    const actual = reducer(
      { products: [product1] },
      {
        type: 'FETCH_PRODUCTS_SUCCEEDED',
        payload: { products: [product2], categories: [category] },
      },
    );

    expect(actual).toEqual(expected);
  });

  test('FETCH_MORE_PRODUCTS_SUCCEEDED action', () => {
    const mockProducts = {
      categories: [
        { id: 37, title: 'first Products', next: 'next-url' },
        { id: 38, title: 'second Products', next: null },
      ],
      notFound: [],
      products: [
        {
          category: 'first Products',
          id: 'product1',
          title: 'Product1 title',
        },
      ],
    };
    const fetchedProduct = [
      {
        category: 'first Products',
        id: 'product2',
        title: 'Product2 title',
      },
    ];
    const expected = {
      ...mockProducts,
      categories: [
        { id: 37, title: 'first Products', next: null },
        { id: 38, title: 'second Products', next: null },
      ],
      products: [...mockProducts.products, ...fetchedProduct],
    };
    const actual = reducer(mockProducts, {
      type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
      payload: { products: fetchedProduct, category: 37, next: null },
    });

    expect(actual).toEqual(expected);
  });

  describe('FETCH_PRODUCT_SUCCEEDED', () => {
    test('adds product', () => {
      const product1 = {
        id: 'p1',
        title: 'Product 1',
      };
      const product2 = {
        id: 'p2',
        title: 'Product 2',
      };
      const expected = { products: [product1, product2] };
      const actual = reducer(
        { products: [product1] },
        {
          type: 'FETCH_PRODUCT_SUCCEEDED',
          payload: { product: product2 },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('stores slug of missing product', () => {
      const product1 = {
        id: 'p1',
        title: 'Product 1',
      };
      const expected = {
        products: [product1],
        notFound: ['product-2', 'product-3'],
      };
      const actual = reducer(
        { products: [product1], notFound: ['product-2'] },
        {
          type: 'FETCH_PRODUCT_SUCCEEDED',
          payload: { product: null, slug: 'product-3' },
        },
      );

      expect(actual).toEqual(expected);
    });
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
    const expected = { products: [product1, modifiedProduct2] };
    const actual = reducer(
      { products: [product1, product2] },
      {
        type: 'FETCH_VERSION_SUCCEEDED',
        payload: { product: 'p2', label: version.label, version },
      },
    );

    expect(actual).toEqual(expected);
  });

  describe('FETCH_ADDITIONAL_PLANS_SUCCEEDED', () => {
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
      const expected = { products: [afterProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
          payload: { product, version, plans },
        },
      );

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
      const expected = { products: [afterProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
          payload: { product, version, plans },
        },
      );

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
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
          payload: { product, version, plans },
        },
      );

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
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
          payload: { product, version, plans },
        },
      );

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
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_ADDITIONAL_PLANS_SUCCEEDED',
          payload: { product, version, plans },
        },
      );

      expect(actual).toEqual(expected);
    });
  });

  describe('FETCH_PLAN_SUCCEEDED', () => {
    test('saves plan on most_recent_version', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
      const plan = { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] };
      const additional_plans = {
        'my-plan': plan,
        'old-slug': plan,
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
      const expected = { products: [afterProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('saves plan on other version', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
      const plan = { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] };
      const existingPlan = { id: 'plan-2', slug: 'other-plan' };
      const additional_plans = {
        'other-plan': existingPlan,
        'my-plan': plan,
        'old-slug': plan,
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
      const expected = { products: [afterProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('saves null if plan is not found', () => {
      const version = 'v1';
      const product = 'p1';
      const slug = 'my-plan';
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
      const expected = { products: [afterProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan: null },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not save if no product matches', () => {
      const version = 'v1';
      const product = 'other-product';
      const slug = 'my-plan';
      const plan = { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [no versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const slug = 'my-plan';
      const plan = { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: { id: 'v1' },
      };
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan },
        },
      );

      expect(actual).toEqual(expected);
    });

    test('does not save if no version matches [has versions]', () => {
      const version = 'other-version';
      const product = 'p1';
      const slug = 'my-plan';
      const plan = { id: 'plan-1', slug: 'my-plan', old_slugs: ['old-slug'] };
      const beforeProduct = {
        id: 'p1',
        most_recent_version: null,
        versions: {
          'version-1': { id: 'v1', label: 'version-1' },
        },
      };
      const expected = { products: [beforeProduct] };
      const actual = reducer(
        { products: [beforeProduct] },
        {
          type: 'FETCH_PLAN_SUCCEEDED',
          payload: { product, version, slug, plan },
        },
      );

      expect(actual).toEqual(expected);
    });
  });
});
