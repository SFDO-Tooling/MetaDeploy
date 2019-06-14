import fetchMock from 'fetch-mock';

import { storeWithApi } from './../../utils';

import * as actions from 'store/user/actions';

describe('login', () => {
  let store;

  beforeEach(() => {
    store = storeWithApi({});
    fetchMock.getOnce(window.api_urls.org_list(), {
      current_job: null,
      current_preflight: null,
    });
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
    const fetchingOrg = {
      type: 'FETCH_ORG_JOBS_STARTED',
    };
    const fetchedOrg = {
      type: 'FETCH_ORG_JOBS_SUCCEEDED',
      payload: { current_job: null, current_preflight: null },
    };

    expect.assertions(1);
    return store.dispatch(actions.login(user)).then(() => {
      expect(store.getActions()).toEqual([loggedIn, fetchingOrg, fetchedOrg]);
    });
  });

  test('subscribes to user/org ws events', () => {
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
    const orgSubscription = {
      model: 'org',
      id: 'org-id',
    };

    expect.assertions(2);
    return store.dispatch(actions.login(user)).then(() => {
      expect(window.socket.subscribe).toHaveBeenCalledWith(userSubscription);
      expect(window.socket.subscribe).toHaveBeenCalledWith(orgSubscription);
    });
  });

  describe('with Raven', () => {
    beforeEach(() => {
      window.Raven = {
        isSetup: () => true,
        setUserContext: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Raven');
    });

    test('sets user context', () => {
      const user = {
        username: 'Test User',
        email: 'test@foo.bar',
      };

      expect.assertions(1);
      return store.dispatch(actions.login(user)).then(() => {
        expect(window.Raven.setUserContext).toHaveBeenCalledWith(user);
      });
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
    window.socket = { reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('dispatches LogoutAction and fetches product', () => {
    const loggedOut = {
      type: 'USER_LOGGED_OUT',
    };
    const started = {
      type: 'FETCH_PRODUCTS_STARTED',
    };
    const succeeded = {
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: { products: [], categories: [] },
    };

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([loggedOut, started, succeeded]);
    });
  });

  test('reconnects socket', () => {
    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(window.socket.reconnect).toHaveBeenCalled();
    });
  });

  describe('with Raven', () => {
    beforeEach(() => {
      window.Raven = {
        isSetup: () => true,
        setUserContext: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Raven');
    });

    test('resets user context', () => {
      expect.assertions(1);
      return store.dispatch(actions.logout()).then(() => {
        expect(window.Raven.setUserContext).toHaveBeenCalledWith();
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
      const loggedIn = {
        type: 'USER_LOGGED_IN',
        payload: user,
      };
      const org = {
        current_job: null,
        current_preflight: null,
      };
      fetchMock.getOnce(window.api_urls.org_list(), org);
      const fetchingOrg = {
        type: 'FETCH_ORG_JOBS_STARTED',
      };
      const fetchedOrg = {
        type: 'FETCH_ORG_JOBS_SUCCEEDED',
        payload: org,
      };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([
          started,
          succeeded,
          loggedOut,
          loggedIn,
          fetchingOrg,
          fetchedOrg,
        ]);
      });
    });

    test('handles missing user', () => {
      const store = storeWithApi({});
      fetchMock.getOnce(window.api_urls.user(), 401);
      const started = { type: 'REFETCH_DATA_STARTED' };
      const succeeded = { type: 'REFETCH_DATA_SUCCEEDED' };
      const loggedOut = { type: 'USER_LOGGED_OUT' };

      expect.assertions(1);
      return store.dispatch(actions.refetchAllData()).then(() => {
        expect(store.getActions()).toEqual([started, succeeded, loggedOut]);
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
        expect(allActions[1].type).toEqual('ERROR_ADDED');
        expect(allActions[1].payload.message).toEqual('Internal Server Error');
        expect(allActions[2]).toEqual(failed);
        expect(window.console.error).toHaveBeenCalled();
      });
    });
  });
});
