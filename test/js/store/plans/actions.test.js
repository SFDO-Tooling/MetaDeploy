import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/plans/actions';

import { storeWithApi } from './../../utils';

describe('fetchPreflight', () => {
  describe('success', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('GETs preflight from api and subscribes to ws events', () => {
      const store = storeWithApi({});
      const preflight = {
        id: 'preflight-1',
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
      const expected = {
        model: 'preflightresult',
        id: 'preflight-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchPreflight('plan-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
      });
    });

    test('handles missing preflight', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.plan_preflight('plan-1'), 404);
      const started = {
        type: 'FETCH_PREFLIGHT_STARTED',
        payload: 'plan-1',
      };
      const succeeded = {
        type: 'FETCH_PREFLIGHT_SUCCEEDED',
        payload: { plan: 'plan-1', preflight: null },
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchPreflight('plan-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).not.toHaveBeenCalled();
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

      expect.assertions(5);
      return store.dispatch(actions.fetchPreflight('plan-1')).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('startPreflight', () => {
  describe('success', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('dispatches PREFLIGHT_STARTED action; subscribes to ws events', () => {
      const store = storeWithApi({});
      const response = {
        id: 'preflight-1',
        plan: 'plan-1',
      };
      fetchMock.postOnce(window.api_urls.plan_preflight('plan-1'), {
        status: 201,
        body: response,
      });
      const started = {
        type: 'PREFLIGHT_REQUESTED',
        payload: 'plan-1',
      };
      const succeeded = {
        type: 'PREFLIGHT_STARTED',
        payload: response,
      };
      const expected = {
        model: 'preflightresult',
        id: 'preflight-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.startPreflight('plan-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
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

      expect.assertions(5);
      return store.dispatch(actions.startPreflight('plan-1')).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

[
  { type: 'PREFLIGHT_COMPLETED', action: 'completePreflight' },
  { type: 'PREFLIGHT_FAILED', action: 'failPreflight' },
  { type: 'PREFLIGHT_CANCELED', action: 'cancelPreflight' },
  { type: 'PREFLIGHT_INVALIDATED', action: 'invalidatePreflight' },
].forEach(({ type, action }) => {
  test(`${action} returns action object: ${type}`, () => {
    const payload = { foo: 'bar' };
    const expected = { type, payload };

    // eslint-disable-next-line import/namespace
    expect(actions[action](payload)).toEqual(expected);
  });
});
