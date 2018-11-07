import reducer from 'jobs/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles JOB_STARTED action', () => {
    const initial = {};
    const expected = { 1: { id: 1 } };
    const actual = reducer(initial, {
      type: 'JOB_STARTED',
      payload: { id: 1 },
    });

    expect(actual).toEqual(expected);
  });
});
