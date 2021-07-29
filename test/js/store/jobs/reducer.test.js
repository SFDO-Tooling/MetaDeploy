import reducer from '@/js/store/jobs/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { 'job-1': null, 'job-2': { id: 'job-2' } };
    const expected = {};
    const actual = reducer(initial, {
      type: 'USER_LOGGED_OUT',
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_JOB_SUCCEEDED action', () => {
    const initial = {};
    const expected = { 'job-1': null };
    const actual = reducer(initial, {
      type: 'FETCH_JOB_SUCCEEDED',
      payload: { id: 'job-1', job: null },
    });

    expect(actual).toEqual(expected);
  });

  [
    { type: 'JOB_STARTED' },
    { type: 'JOB_COMPLETED' },
    { type: 'JOB_FAILED' },
    { type: 'JOB_CANCELED' },
    { type: 'JOB_UPDATED' },
    { type: 'JOB_STEP_COMPLETED' },
  ].forEach(({ type }) => {
    test(`handles ${type} action`, () => {
      const initial = {};
      const expected = { 'job-1': { id: 'job-1' } };
      const actual = reducer(initial, {
        type,
        payload: { id: 'job-1' },
      });

      expect(actual).toEqual(expected);
    });
  });

  describe('with existing job', () => {
    test('updates with newer job', () => {
      const initial = {
        'job-1': {
          id: 'job-1',
          steps: ['step-1'],
          results: {},
          edited_at: '1',
        },
      };
      const incoming = {
        ...initial['job-1'],
        results: { 'step-1': [{ status: 'ok' }] },
        edited_at: '2',
      };
      const expected = {
        'job-1': incoming,
      };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: incoming,
      });

      expect(actual).toEqual(expected);
    });

    test('ignores older job', () => {
      const initial = {
        'job-1': {
          id: 'job-1',
          steps: ['step-1', 'step-2'],
          results: { 'step-1': [{ status: 'ok' }] },
          edited_at: '2',
        },
      };
      const incoming = {
        ...initial['job-1'],
        results: {},
        edited_at: '1',
      };
      const actual = reducer(initial, {
        type: 'JOB_STEP_COMPLETED',
        payload: incoming,
      });

      expect(actual).toEqual(initial);
    });
  });
});
