import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'plans/actions';

describe('fetchPreflight', () => {
  describe('success', () => {
    test('GETs preflight from api', () => {
      const store = storeWithApi({});
      const preflight = {
        plan: 'plan-1',
        status: 'complete',
        results: {},
        is_valid: true,
        error_count: 0,
        warning_count: 0,
      };
      fetchMock.getOnce(window.api_urls.plan_preflight('plan-1'), preflight);
      const started = {
        type: 'FETCH_PREFLIGHT_STARTED',
        payload: 'plan-1',
      };
      const succeeded = {
        type: 'FETCH_PREFLIGHT_SUCCEEDED',
        payload: { plan: 'plan-1', preflight },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchPreflight('plan-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_PREFLIGHT_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.plan_preflight('plan-1'), 500);
      const started = {
        type: 'FETCH_PREFLIGHT_STARTED',
        payload: 'plan-1',
      };
      const failed = {
        type: 'FETCH_PREFLIGHT_FAILED',
        payload: 'plan-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchPreflight('plan-1')).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('startPreflight', () => {
  describe('success', () => {
    test('dispatches PREFLIGHT_STARTED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.plan_preflight('plan-1'), 202);
      const started = {
        type: 'PREFLIGHT_REQUESTED',
        payload: 'plan-1',
      };
      const succeeded = {
        type: 'PREFLIGHT_STARTED',
        payload: 'plan-1',
      };

      expect.assertions(1);
      return store.dispatch(actions.startPreflight('plan-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches PREFLIGHT_REJECTED action', () => {
      const store = storeWithApi({});
      fetchMock.postOnce(window.api_urls.plan_preflight('plan-1'), 500);
      const started = {
        type: 'PREFLIGHT_REQUESTED',
        payload: 'plan-1',
      };
      const failed = {
        type: 'PREFLIGHT_REJECTED',
        payload: 'plan-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.startPreflight('plan-1')).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

[
  { type: 'PREFLIGHT_COMPLETED', action: 'completePreflight' },
  { type: 'PREFLIGHT_FAILED', action: 'failPreflight' },
  { type: 'PREFLIGHT_INVALIDATED', action: 'invalidatePreflight' },
].forEach(({ type, action }) => {
  test(`${action} returns action object: ${type}`, () => {
    const payload = { foo: 'bar' };
    const expected = { type, payload };

    expect(actions[action](payload)).toEqual(expected);
  });
});
