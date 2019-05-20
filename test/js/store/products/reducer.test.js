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

  test('handles FETCH_PLANS_SUCCEEDED without versions', () => {
    const version = 'v1';
    const product = 'p1';
    const plans = [{ id: 'kcsl', title: 'title', slug: 'slug', old_slugs: [] }];
    const additional_plans = {
      slug: { id: 'kcsl', title: 'title', slug: 'slug', old_slugs: [] },
    };
    const beforeProduct = {
      id: 'p1',
      title: 'Product 1',
      most_recent_version: {
        id: 'v1',
      },
    };
    const afterProduct = {
      id: 'p1',
      title: 'Product 1',
      most_recent_version: {
        id: 'v1',
        additional_plans,
        fetched_additional_plans: true,
      },
    };
    const expected = [afterProduct];
    const actual = reducer([beforeProduct], {
      type: 'FETCH_PLANS_SUCCEEDED',
      payload: { product, version, response: plans },
    });
    expect(actual).toEqual(expected);
  });
  test('handles FETCH_PLANS_SUCCEEDED with versions', () => {
    const version = 'v1';
    const product = 'p1';
    const plans = [{ id: 'v1', title: 'title', slug: 'slug', old_slugs: [] }];
    const additional_plans = {
      slug: { id: 'v1', title: 'title', slug: 'slug', old_slugs: [] },
    };
    const product2 = {
      id: 'p2',
      title: 'Product 2',
    };
    const beforeProduct = {
      id: 'p1',
      title: 'Product 1',
      versions: {
        '2.0': { id: version, label: '2.0' },
      },
    };
    const afterProduct = {
      id: 'p1',
      title: 'Product 1',
      versions: {
        '2.0': {
          id: version,
          label: '2.0',
          additional_plans,
          fetched_additional_plans: true,
        },
      },
    };

    const expected = [product2, afterProduct];
    const actual = reducer([product2, beforeProduct], {
      type: 'FETCH_PLANS_SUCCEEDED',
      payload: { product, version, response: plans },
    });
    expect(actual).toEqual(expected);
  });
  test('handles FETCH_PLAN_SUCCEEDED', () => {
    const plan = [
      { id: 'v1', version: 'v1', slug: 'account-type', old_slugs: [] },
    ];
    const additional_plans = {
      'account-type': {
        id: 'v1',
        version: 'v1',
        slug: 'account-type',
        old_slugs: [],
      },
    };
    const product2 = {
      id: 'p2',
      title: 'Product 2',
    };
    const beforeProduct = {
      id: 'p1',
      title: 'Product 1',
      most_recent_version: {
        id: 'v1',
      },
    };

    const afterProduct = {
      id: 'p1',
      title: 'Product 1',
      most_recent_version: {
        id: 'v1',
        additional_plans,
      },
    };
    const expected = [product2, afterProduct];

    const actual = reducer([product2, beforeProduct], {
      type: 'FETCH_PLAN_SUCCEEDED',
      payload: plan,
    });
    expect(actual).toEqual(expected);
  });
});
