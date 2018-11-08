import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'jobs/actions';

describe('startJob', () => {
  describe('success', () => {
    test('dispatches JOB_STARTED action', () => {
      const store = storeWithApi({});
      const data = { plan: 'plan-1', steps: ['step-1'] };
      const response = {
        id: 'job-1',
        plan: 'plan-1',
        steps: ['step-1'],
      };
      fetchMock.postOnce(window.api_urls.job_list(), {
        status: 201,
        body: response,
      });
      const started = {
        type: 'JOB_REQUESTED',
        payload: data,
      };
      const succeeded = {
        type: 'JOB_STARTED',
        payload: response,
      };

      expect.assertions(1);
      return store.dispatch(actions.startJob(data)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches JOB_REJECTED action', () => {
      const store = storeWithApi({});
      const data = { plan: 'plan-1', steps: ['step-1'] };
      fetchMock.postOnce(window.api_urls.job_list(), 500);
      const started = {
        type: 'JOB_REQUESTED',
        payload: data,
      };
      const failed = {
        type: 'JOB_REJECTED',
        payload: data,
      };

      expect.assertions(2);
      return store.dispatch(actions.startJob(data)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
