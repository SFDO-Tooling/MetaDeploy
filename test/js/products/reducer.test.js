import reducer from 'products/reducer';

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
});
