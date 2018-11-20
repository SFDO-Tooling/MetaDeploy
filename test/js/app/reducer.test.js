import reducer from 'app/reducer';

describe('reducer', () => {
  test('combines child reducers', () => {
    const actual = reducer(undefined, {});

    expect(Object.keys(actual)).toEqual([
      'user',
      'products',
      'preflights',
      'jobs',
    ]);
  });
});
