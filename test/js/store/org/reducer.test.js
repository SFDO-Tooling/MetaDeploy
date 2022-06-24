import reducer from '@/js/store/org/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = {};
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = {
      'org-id': {
        org_id: 'org-id',
        current_job: null,
        current_preflight: null,
      },
    };
    const expected = {};
    const actual = reducer(initial, {
      type: 'USER_LOGGED_OUT',
    });

    expect(actual).toEqual(expected);
  });

  test('handles FETCH_ORG_JOBS_SUCCEEDED action', () => {
    const initial = {};
    const payload = {
      org_id: 'org-id',
      current_job: null,
      current_preflight: null,
    };
    const actual = reducer(initial, {
      type: 'FETCH_ORG_JOBS_SUCCEEDED',
      payload,
    });

    expect(actual).toEqual(payload);
  });

  test('handles ORG_CHANGED action', () => {
    const initial = { 'other-org': {} };
    const payload = {
      org_id: 'org-id',
      current_job: null,
      current_preflight: null,
    };
    const expected = { ...initial, 'org-id': payload };
    const actual = reducer(initial, {
      type: 'ORG_CHANGED',
      payload,
    });

    expect(actual).toEqual(expected);
  });
});
