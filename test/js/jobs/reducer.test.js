import reducer from 'jobs/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles JOB_STARTED action', () => {
    const initial = {};
    const expected = { 'step-1': { id: 'step-1' } };
    const actual = reducer(initial, {
      type: 'JOB_STARTED',
      payload: { id: 'step-1' },
    });

    expect(actual).toEqual(expected);
  });
});
