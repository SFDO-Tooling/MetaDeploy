import reducer from '@/js/store/scratchOrgs/reducer';

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

  test('handles FETCH_SCRATCH_ORG_SUCCEEDED action', () => {
    const initial = {};
    const expected = { 'plan-1': { plan: 'plan-1' } };
    const actual = reducer(initial, {
      type: 'FETCH_SCRATCH_ORG_SUCCEEDED',
      payload: { plan: 'plan-1', org: { plan: 'plan-1' } },
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_SCRATCH_ORG_SUCCEEDED action with no org', () => {
    const initial = { 'plan-1': { plan: 'plan-1' } };
    const expected = { 'plan-1': { plan: 'plan-1' }, 'plan-2': null };
    const actual = reducer(initial, {
      type: 'FETCH_SCRATCH_ORG_SUCCEEDED',
      payload: { plan: 'plan-2', org: null },
    });

    expect(actual).toEqual(expected);
  });

  [{ type: 'SCRATCH_ORG_SPINNING' }, { type: 'SCRATCH_ORG_UPDATED' }].forEach(
    ({ type }) => {
      test(`handles ${type} action`, () => {
        const initial = {
          'plan-2': { status: 'started', edited_at: '1' },
        };
        const expected = {
          'plan-2': { plan: 'plan-2', status: 'complete', edited_at: '2' },
        };
        const actual = reducer(initial, {
          type,
          payload: { plan: 'plan-2', status: 'complete', edited_at: '2' },
        });

        expect(actual).toEqual(expected);
      });
    },
  );

  describe('with existing scratch org', () => {
    test('updates with newer scratch org', () => {
      const initial = {
        'plan-2': { plan: 'plan-2', foo: 'bar', edited_at: '1' },
      };
      const incoming = { plan: 'plan-2', foo: 'changed', edited_at: '2' };
      const expected = {
        'plan-2': incoming,
      };
      const actual = reducer(initial, {
        type: 'SCRATCH_ORG_UPDATED',
        payload: incoming,
      });

      expect(actual).toEqual(expected);
    });

    test('ignores older scratch org', () => {
      const initial = {
        'plan-2': { plan: 'plan-2', foo: 'bar', edited_at: '2' },
      };
      const incoming = { plan: 'plan-2', foo: 'changed', edited_at: '1' };
      const actual = reducer(initial, {
        type: 'SCRATCH_ORG_UPDATED',
        payload: incoming,
      });

      expect(actual).toEqual(initial);
    });
  });

  [{ type: 'SCRATCH_ORG_FAILED' }, { type: 'SCRATCH_ORG_ERROR' }].forEach(
    ({ type }) => {
      test(`handles ${type} action`, () => {
        const initial = { 'plan-1': { status: 'started' } };
        const expected = { 'plan-1': null };
        const actual = reducer(initial, {
          type,
          payload: 'plan-1',
        });

        expect(actual).toEqual(expected);
      });
    },
  );
});
