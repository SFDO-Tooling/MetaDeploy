import fetchMock from 'fetch-mock';

import * as actions from '@/js/store/user/actions';

import { storeWithApi } from './../../utils';

describe('login', () => {
  beforeEach(() => {
    window.socket = { subscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('returns LoginAction', () => {
    const user = {
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const loggedIn = {
      type: 'USER_LOGGED_IN',
      payload: user,
    };

    expect(actions.login(user)).toEqual(loggedIn);
  });

  test('subscribes to user ws events', () => {
    const user = {
      id: 'user-id',
      username: 'Test User',
      email: 'test@foo.bar',
      valid_token_for: 'org-id',
    };
    const userSubscription = {
      model: 'user',
      id: 'user-id',
    };
    actions.login(user);

    expect(window.socket.subscribe).toHaveBeenCalledWith(userSubscription);
  });

  describe('with Sentry', () => {
    beforeEach(() => {
      window.Sentry = {
        setUser: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('sets user context', () => {
      const user = {
        username: 'Test User',
        email: 'test@foo.bar',
      };
      actions.login(user);

      expect(window.Sentry.setUser).toHaveBeenCalledWith(user);
    });
  });
});

describe('logout', () => {
  let store;

  beforeEach(() => {
    store = storeWithApi({});
    fetchMock.getOnce(window.api_urls.productcategory_list(), []);
    fetchMock.postOnce(window.api_urls.account_logout(), {
      status: 204,
      body: {},
    });
    fetchMock.getOnce(window.api_urls.org_list(), {
      current_job: null,
      current_preflight: null,
    });

    window.socket = { subscribe: jest.fn(), reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('dispatches LogoutAction and fetches products and org-jobs', () => {
    const loggedOut = {
      type: 'USER_LOGGED_OUT',
    };
    const fetchingProducts = {
      type: 'FETCH_PRODUCTS_STARTED',
    };
    const fetchedProducts = {
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: { products: [], categories: [] },
    };
    const fetchingOrg = {
      type: 'FETCH_ORG_JOBS_STARTED',
    };
    const fetchedOrg = {
      type: 'FETCH_ORG_JOBS_SUCCEEDED',
      payload: { current_job: null, current_preflight: null },
    };

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([
        loggedOut,
        fetchingProducts,
        fetchingOrg,
        fetchedProducts,
        fetchedOrg,
      ]);
    });
  });

  test('reconnects socket', () => {
    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(window.socket.reconnect).toHaveBeenCalled();
    });
  });

  describe('with Sentry', () => {
    let scope;

    beforeEach(() => {
      scope = {
        clear: jest.fn(),
      };
      window.Sentry = {
        configureScope: (cb) => cb(scope),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('resets user context', () => {
      expect.assertions(1);
      return store.dispatch(actions.logout()).then(() => {
        expect(scope.clear).toHaveBeenCalled();
      });
    });
  });
});

describe('invalidateToken', () => {
  test('returns TokenInvalidAction', () => {
    const expected = { type: 'USER_TOKEN_INVALIDATED' };

    expect(actions.invalidateToken()).toEqual(expected);
  });
});

describe('refetchAllData', () => {
  describe('success', () => {
    test('GETs user from api', () => {
      const store = storeWithApi({});
      const user = { id: 'me' };
      fetchMock.getOnce(window.api_urls.user(), user);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };
      const fetchingOrgs = { type: 'FETCH_ORG_JOBS_STARTED' };
      const loggedIn = {
        type: 'USER_LOGGED_IN',
        payload: user,
      };
      const orgs = {
        'org-id': {
          org_id: 'org-id',
          current_job: null,
          current_preflight: null,
        },
      };
      fetchMock.getOnce(window.api_urls.org_list(), orgs);

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          succeeded,
          loggedOut,
          fetchingOrgs,
          loggedIn,
        ]);
      });
    });

    test('handles missing user', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.user(), 401);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };
      const fetchingOrgs = { type: 'FETCH_ORG_JOBS_STARTED' };
      const orgs = {
        'org-id': {
          org_id: 'org-id',
          current_job: null,
          current_preflight: null,
        },
      };
      fetchMock.getOnce(window.api_urls.org_list(), orgs);

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          succeeded,
          loggedOut,
          fetchingOrgs,
        ]);
      });
    });
  });

  describe('error', () => {
    test('dispatches REFETCH_DATA_FAILED action', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.user(), 500);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const failed = { type: 'REFETCH_DATA_FAILED' };

      expect.assertions(5);
      return store.dispatch(actions.refetchAllData()).catch(() => {
        const allActions = store.getActions();

        expect(allActions[0]).toEqual(started);
        expect(allActions[1].type).toBe('ERROR_ADDED');
        expect(allActions[1].payload.message).toBe('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
