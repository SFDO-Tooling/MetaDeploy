import reducer from 'products/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = [];
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PRODUCTS_SUCCEEDED action', () => {
    const product1 = {
      id: 1,
      title: 'Product 1',
      version: '3.130',
      description: 'This is a test product.',
    };
    const product2 = {
      id: 2,
      title: 'Product 2',
      version: '3.131',
      description: 'This is another test product.',
    };
    const expected = [product2];
    const actual = reducer([product1], {
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });
});
