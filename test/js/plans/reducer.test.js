import reducer from 'plans/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_PREFLIGHT_SUCCEEDED action', () => {
    const initial = { 1: null, 2: { status: 'started' } };
    const expected = { 1: null, 2: { status: 'complete' } };
    const actual = reducer(initial, {
      type: 'FETCH_PREFLIGHT_SUCCEEDED',
      payload: { plan: 2, preflight: { status: 'complete' } },
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_STARTED action', () => {
    const initial = { 1: null };
    const expected = { 1: null, 2: { status: 'started' } };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_STARTED',
      payload: 2,
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_COMPLETED action', () => {
    const initial = { 1: null, 2: { status: 'started' } };
    const expected = { 1: null, 2: { plan: 2, status: 'complete' } };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_COMPLETED',
      payload: { plan: 2, status: 'complete' },
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_FAILED action', () => {
    const initial = { 1: null, 2: { status: 'started' } };
    const expected = { 1: null, 2: { plan: 2, status: 'failed' } };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_FAILED',
      payload: { plan: 2, status: 'failed' },
    });

    expect(actual).toEqual(expected);
  });

  test('handles PREFLIGHT_FAILED action', () => {
    const initial = { 1: null, 2: { status: 'complete', is_valid: true } };
    const expected = {
      1: null,
      2: { plan: 2, status: 'complete', is_valid: false },
    };
    const actual = reducer(initial, {
      type: 'PREFLIGHT_FAILED',
      payload: { plan: 2, status: 'complete', is_valid: false },
    });

    expect(actual).toEqual(expected);
  });
});
