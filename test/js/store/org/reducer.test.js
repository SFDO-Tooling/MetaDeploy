import reducer from 'store/org/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = null;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = {};
    const expected = null;
    const actual = reducer(initial, {
      type: 'USER_LOGGED_OUT',
    });

    expect(actual).toEqual(expected);
  });

  [{ type: 'FETCH_ORG_JOBS_SUCCEEDED' }, { type: 'ORG_CHANGED' }].forEach(
    ({ type }) => {
      test(`handles ${type} action`, () => {
        const initial = null;
        const payload = { current_job: null, current_preflight: null };
        const actual = reducer(initial, {
          type,
          payload,
        });

        expect(actual).toEqual(payload);
      });
    },
  );

  test('handles PREFLIGHT_COMPLETED action', () => {
    const initial = { current_preflight: 1 };
    const expected = { current_preflight: null };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_COMPLETED',
    });
    expect(actual).toEqual(expected);
  });
});
