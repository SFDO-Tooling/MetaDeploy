import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'jobs/actions';

describe('fetchJob', () => {
  describe('success', () => {
    test('GETs job from api', () => {
      const store = storeWithApi({});
      const job = {
        id: 'job-1',
        creator: null,
        plan: 'plan-1',
        status: 'complete',
        steps: [],
        completed_steps: [],
        org_name: null,
        org_type: null,
      };
      fetchMock.getOnce(window.api_urls.job_detail('job-1'), job);
      const started = {
        type: 'FETCH_JOB_STARTED',
        payload: 'job-1',
      };
      const succeeded = {
        type: 'FETCH_JOB_SUCCEEDED',
        payload: { id: 'job-1', job },
      };

      expect.assertions(1);
      return store.dispatch(actions.fetchJob('job-1')).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_JOB_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.job_detail('job-1'), 500);
      const started = {
        type: 'FETCH_JOB_STARTED',
        payload: 'job-1',
      };
      const failed = {
        type: 'FETCH_JOB_FAILED',
        payload: 'job-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchJob('job-1')).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

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

describe('completeJobStep', () => {
  test('returns JobStepCompleted', () => {
    const payload = { foo: 'bar' };
    const expected = { type: 'JOB_STEP_COMPLETED', payload };

    expect(actions.completeJobStep(payload)).toEqual(expected);
  });
});

describe('completeJob', () => {
  test('returns JobCompleted', () => {
    const payload = { foo: 'bar' };
    const expected = { type: 'JOB_COMPLETED', payload };

    expect(actions.completeJob(payload)).toEqual(expected);
  });
});

describe('updateJob', () => {
  describe('success', () => {
    test('dispatches JOB_UPDATED action', () => {
      const store = storeWithApi({});
      const data = { id: 'job-1', is_public: 'true' };
      const response = {
        id: 'job-1',
        is_public: true,
      };
      fetchMock.patchOnce(window.api_urls.job_detail('job-1'), {
        status: 200,
        body: response,
      });
      const started = {
        type: 'JOB_UPDATE_REQUESTED',
        payload: data,
      };
      const succeeded = {
        type: 'JOB_UPDATED',
        payload: response,
      };

      expect.assertions(1);
      return store.dispatch(actions.updateJob(data)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches JOB_UPDATE_REJECTED action', () => {
      const store = storeWithApi({});
      const data = { id: 'job-1', is_public: 'true' };
      fetchMock.patchOnce(window.api_urls.job_detail('job-1'), 500);
      const started = {
        type: 'JOB_UPDATE_REQUESTED',
        payload: data,
      };
      const failed = {
        type: 'JOB_UPDATE_REJECTED',
        payload: data,
      };

      expect.assertions(2);
      return store.dispatch(actions.updateJob(data)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
