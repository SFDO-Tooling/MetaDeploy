import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/jobs/actions';
import { addUrlParams } from '@/js/utils/api';
import { LATEST_VERSION } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

import { getStoreWithHistory, storeWithApi } from './../../utils';

describe('fetchJob', () => {
  let args, params, url;

  beforeEach(() => {
    args = {
      jobId: 'job-1',
      productSlug: 'my-product',
      versionLabel: 'my-version',
      planSlug: 'plan-1',
    };
    params = {
      plan__plan_template__planslug__slug: args.planSlug,
      plan__version__label: args.versionLabel,
      plan__version__product__productslug__slug: args.productSlug,
    };
    url = addUrlParams(window.api_urls.job_detail('job-1'), params);
  });

  describe('success', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('GETs job from api and subscribes to ws events', () => {
      const store = storeWithApi({});
      const job = {
        id: 'job-1',
        creator: null,
        plan: 'plan-1',
        status: 'complete',
        steps: [],
        results: {},
        org_name: null,
        org_type: null,
      };
      fetchMock.getOnce(url, job);
      const started = {
        type: 'FETCH_JOB_STARTED',
        payload: 'job-1',
      };
      const succeeded = {
        type: 'FETCH_JOB_SUCCEEDED',
        payload: { id: 'job-1', job },
      };
      const expected = {
        model: 'job',
        id: 'job-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchJob(args)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
      });
    });

    test('handles missing job', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, 404);
      const started = {
        type: 'FETCH_JOB_STARTED',
        payload: 'job-1',
      };
      const succeeded = {
        type: 'FETCH_JOB_SUCCEEDED',
        payload: { id: 'job-1', job: null },
      };

      expect.assertions(2);
      return store.dispatch(actions.fetchJob(args)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).not.toHaveBeenCalled();
      });
    });
  });

  describe('error', () => {
    test('dispatches FETCH_JOB_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(url, { status: 500, body: {} });
      const started = {
        type: 'FETCH_JOB_STARTED',
        payload: 'job-1',
      };
      const failed = {
        type: 'FETCH_JOB_FAILED',
        payload: 'job-1',
      };

      expect.assertions(5);
      return store.dispatch(actions.fetchJob(args)).catch(() => {
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

describe('startJob', () => {
  describe('success', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('dispatches JOB_STARTED action and subscribes to ws events', () => {
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
      const expected = {
        model: 'job',
        id: 'job-1',
      };

      expect.assertions(2);
      return store.dispatch(actions.startJob(data)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
        expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
      });
    });
  });

  describe('error', () => {
    test('dispatches JOB_REJECTED action', () => {
      const store = storeWithApi({});
      const data = { plan: 'plan-1', steps: ['step-1'] };
      fetchMock.postOnce(window.api_urls.job_list(), 404);
      const started = {
        type: 'JOB_REQUESTED',
        payload: data,
      };
      const failed = {
        type: 'JOB_REJECTED',
        payload: data,
      };

      expect.assertions(1);
      return store.dispatch(actions.startJob(data)).catch(() => {
        expect(store.getActions()).toEqual([started, failed]);
      });
    });
  });
});

describe('createJob', () => {
  describe('success', () => {
    beforeEach(() => {
      window.socket = { subscribe: jest.fn() };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'socket');
    });

    test('dispatches JOB_STARTED action subscribes to ws events, redirects', () => {
      const push = jest.fn();
      const store = getStoreWithHistory({
        location: {
          pathname: routes.plan_detail('product-1', 'version-1', 'plan-1'),
        },
        push,
      })({});
      const job = {
        id: 'job-1',
        plan: 'plan-1',
        steps: ['step-1'],
        product_slug: 'product-1',
        version_label: 'version-1',
        version_is_most_recent: false,
        plan_slug: 'plan-1',
      };
      const started = {
        type: 'JOB_STARTED',
        payload: job,
      };
      const expected = {
        model: 'job',
        id: job.id,
      };
      const url = routes.job_detail('product-1', 'version-1', 'plan-1', job.id);

      store.dispatch(actions.createJob(job));

      expect(store.getActions()).toEqual([started]);
      expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
      expect(push).toHaveBeenCalledWith(url);
    });

    test('redirects if on "latest" plan URL', () => {
      const push = jest.fn();
      const store = getStoreWithHistory({
        location: {
          pathname: routes.plan_detail('product-1', LATEST_VERSION, 'plan-1'),
        },
        push,
      })({});
      const job = {
        id: 'job-1',
        plan: 'plan-1',
        steps: ['step-1'],
        product_slug: 'product-1',
        version_label: 'version-1',
        version_is_most_recent: true,
        plan_slug: 'plan-1',
      };
      const url = routes.job_detail('product-1', 'version-1', 'plan-1', job.id);
      store.dispatch(actions.createJob(job));

      expect(push).toHaveBeenCalledWith(url);
    });
  });
});

[
  { type: 'JOB_STEP_COMPLETED', action: 'completeJobStep' },
  { type: 'JOB_COMPLETED', action: 'completeJob' },
  { type: 'JOB_CANCELED', action: 'cancelJob' },
  { type: 'JOB_FAILED', action: 'failJob' },
].forEach(({ type, action }) => {
  test(`${action} returns action object: ${type}`, () => {
    const payload = { foo: 'bar' };
    const expected = { type, payload };

    // eslint-disable-next-line import/namespace
    expect(actions[action](payload)).toEqual(expected);
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
      fetchMock.patchOnce(window.api_urls.job_detail('job-1'), {
        status: 500,
        body: { detail: 'Nope.' },
      });
      const started = {
        type: 'JOB_UPDATE_REQUESTED',
        payload: data,
      };
      const failed = {
        type: 'JOB_UPDATE_REJECTED',
        payload: data,
      };

      expect.assertions(5);
      return store.dispatch(actions.updateJob(data)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Nope.');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});

describe('requestCancelJob', () => {
  describe('success', () => {
    test('dispatches JOB_CANCEL_ACCEPTED action', () => {
      const store = storeWithApi({});
      const id = 'job-1';
      fetchMock.deleteOnce(window.api_urls.job_detail(id), 204);
      const started = {
        type: 'JOB_CANCEL_REQUESTED',
        payload: id,
      };
      const succeeded = {
        type: 'JOB_CANCEL_ACCEPTED',
        payload: id,
      };

      expect.assertions(1);
      return store.dispatch(actions.requestCancelJob(id)).then(() => {
        expect(store.getActions()).toEqual([started, succeeded]);
      });
    });
  });

  describe('error', () => {
    test('dispatches JOB_CANCEL_REJECTED action', () => {
      const store = storeWithApi({});
      const id = 'job-1';
      fetchMock.deleteOnce(window.api_urls.job_detail(id), {
        status: 500,
        body: 'Oops.',
      });
      const started = {
        type: 'JOB_CANCEL_REQUESTED',
        payload: id,
      };
      const failed = {
        type: 'JOB_CANCEL_REJECTED',
        payload: id,
      };

      expect.assertions(5);
      return store.dispatch(actions.requestCancelJob(id)).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Oops.');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
