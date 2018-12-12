import reducer from 'plans/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { 'plan-1': null, 'plan-2': { status: 'started' } };
    const expected = {};
    const actual = reducer(initial, {
      type: 'USER_LOGGED_OUT',
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PREFLIGHT_SUCCEEDED action', () => {
    const initial = { 'plan-1': null, 'plan-2': { status: 'started' } };
    const expected = { 'plan-1': null, 'plan-2': { status: 'complete' } };
    const actual = reducer(initial, {
      type: 'FETCH_PREFLIGHT_SUCCEEDED',
      payload: { plan: 'plan-2', preflight: { status: 'complete' } },
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_STARTED action', () => {
    const initial = { 'plan-1': null };
    const expected = {
      'plan-1': null,
      'plan-2': {
        id: null,
        edited_at: null,
        plan: 'plan-2',
        status: 'started',
        results: {},
        is_valid: true,
        error_count: 0,
        warning_count: 0,
        is_ready: false,
      },
    };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_STARTED',
      payload: 'plan-2',
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_COMPLETED action', () => {
    const initial = { 'plan-1': null, 'plan-2': { status: 'started' } };
    const expected = {
      'plan-1': null,
      'plan-2': { plan: 'plan-2', status: 'complete' },
    };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_COMPLETED',
      payload: { plan: 'plan-2', status: 'complete' },
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_FAILED action', () => {
    const initial = { 'plan-1': null, 'plan-2': { status: 'started' } };
    const expected = {
      'plan-1': null,
      'plan-2': { plan: 'plan-2', status: 'failed' },
    };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_FAILED',
      payload: { plan: 'plan-2', status: 'failed' },
    });

    expect(actual).toEqual(expected);
  });

  describe('PREFLIGHT_INVALIDATED', () => {
    test('adds new preflight', () => {
      const initial = {};
      const expected = {
        'plan-2': { plan: 'plan-2', is_valid: false },
      };
      const actual = reducer(initial, {
        type: 'PREFLIGHT_INVALIDATED',
        payload: { plan: 'plan-2', is_valid: false },
      });

      expect(actual).toEqual(expected);
    });

    test('updates existing preflight', () => {
      const initial = {
        'plan-1': null,
        'plan-2': { plan: 'plan-2', is_valid: true, edited_at: '1' },
      };
      const incoming = { plan: 'plan-2', is_valid: false, edited_at: '2' };
      const expected = {
        'plan-1': null,
        'plan-2': incoming,
      };
      const actual = reducer(initial, {
        type: 'PREFLIGHT_INVALIDATED',
        payload: incoming,
      });

      expect(actual).toEqual(expected);
    });

    test('ignores older preflight', () => {
      const initial = {
        'plan-1': null,
        'plan-2': { plan: 'plan-2', is_valid: true, edited_at: '2' },
      };
      const incoming = { plan: 'plan-2', is_valid: false, edited_at: '1' };
      const actual = reducer(initial, {
        type: 'PREFLIGHT_INVALIDATED',
        payload: incoming,
      });

      expect(actual).toEqual(initial);
    });
  });
});
