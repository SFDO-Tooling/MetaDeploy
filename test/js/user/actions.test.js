import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'user/actions';
import { cache } from 'utils/caching';

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
      valid_token_for: 'org-url',
    };
    const userSubscription = {
      model: 'user',
      id: 'user-id',
    };
    const orgSubscription = {
      model: 'org',
      id: 'org-url',
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
    fetchMock.getOnce(window.api_urls.product_list(), []);
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
      payload: [],
    };

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([loggedOut, started, succeeded]);
    });
  });

  test('clears cache', () => {
    cache.clear = jest.fn();

    expect.assertions(1);
    return store.dispatch(actions.logout()).then(() => {
      expect(cache.clear).toHaveBeenCalled();
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
