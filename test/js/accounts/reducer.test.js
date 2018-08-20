import reducer from 'accounts/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = null;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_IN action', () => {
    const expected = { username: 'Test User' };
    const actual = reducer(null, { type: 'USER_LOGGED_IN', payload: expected });

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const expected = null;
    const actual = reducer(
      { username: 'Test User' },
      { type: 'USER_LOGGED_OUT' },
    );

    expect(actual).toEqual(expected);
  });
});
