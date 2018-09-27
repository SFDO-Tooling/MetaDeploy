import reducer from 'settings/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = { activeProductsTab: null };
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles PRODUCTS_TAB_ACTIVE action', () => {
    const expected = { activeProductsTab: 'salesforce' };
    const actual = reducer(null, {
      type: 'PRODUCTS_TAB_ACTIVE',
      payload: 'salesforce',
    });

    expect(actual).toEqual(expected);
  });
});
