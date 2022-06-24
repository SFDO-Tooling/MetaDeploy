import reducer from '@/js/store/user/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = null;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_IN action', () => {
    const initial = null;
    const expected = { username: 'Test User' };
    const actual = reducer(initial, {
      type: 'USER_LOGGED_IN',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { username: 'Test User' };
    const expected = null;
    const actual = reducer(initial, { type: 'USER_LOGGED_OUT' });

    expect(actual).toEqual(expected);
  });

  test('handles USER_TOKEN_INVALIDATED action', () => {
    const initial = {
      username: 'Test User',
      valid_token_for: '00Dxxxxxxxxxxxxxxx',
    };
    const expected = { username: 'Test User', valid_token_for: null };
    const actual = reducer(initial, { type: 'USER_TOKEN_INVALIDATED' });

    expect(actual).toEqual(expected);
  });

  test('handles USER_TOKEN_INVALIDATED action (no user)', () => {
    const initial = null;
    const expected = null;
    const actual = reducer(initial, { type: 'USER_TOKEN_INVALIDATED' });

    expect(actual).toEqual(expected);
  });
});
