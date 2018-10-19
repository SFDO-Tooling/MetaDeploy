import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'plans/actions';

describe('fetchPreflight', () => {
  afterEach(fetchMock.reset);

  describe('success', () => {
    test('GETs preflight from api', () => {
      const store = storeWithApi({});
      const preflight = {
        plan: 1,
        status: 'complete',
        results: {},
        is_valid: true,
        has_errors: false,
      };
      fetchMock.getOnce(window.api_urls.plan_preflight(1), preflight);
      const started = {
        type: 'FETCH_PREFLIGHT_STARTED',
        payload: 1,
      };
      const succeeded = {
        type: 'FETCH_PREFLIGHT_SUCCEEDED',
        payload: { plan: 1, preflight },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPreflight(1)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PREFLIGHT_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.plan_preflight(1), 500);
      const started = {
        type: 'FETCH_PREFLIGHT_STARTED',
        payload: 1,
      };
      const failed = {
        type: 'FETCH_PREFLIGHT_FAILED',
        payload: 1,
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchPreflight(1)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('startPreflight', () => {
  afterEach(fetchMock.reset);

  describe('success', () => {
    test('dispatches PREFLIGHT_STARTED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.plan_preflight(1), 202);
      const started = {
        type: 'PREFLIGHT_REQUESTED',
        payload: 1,
      };
      const succeeded = {
        type: 'PREFLIGHT_STARTED',
        payload: 1,
      };

      expect.assertions(1);
      return store.dispatch(actions.startPreflight(1)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches PREFLIGHT_REJECTED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.plan_preflight(1), 500);
      const started = {
        type: 'PREFLIGHT_REQUESTED',
        payload: 1,
      };
      const failed = {
        type: 'PREFLIGHT_REJECTED',
        payload: 1,
      };

      expect.assertions(2);
      return store.dispatch(actions.startPreflight(1)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('completePreflight', () => {
  test('returns PreflightCompleted', () => {
    const payload = { foo: 'bar' };
    const expected = { type: 'PREFLIGHT_COMPLETED', payload };

    expect(actions.completePreflight(payload)).toEqual(expected);
  });
});
