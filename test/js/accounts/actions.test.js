import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'accounts/actions';
import { cache } from 'utils/caching';

describe('login', () => {
  test('returns LoginAction', () => {
    const user = {
      username: 'Test User',
      email: 'test@foo.bar',
    };
    const expected = {
      type: 'USER_LOGGED_IN',
      payload: user,
    };

    expect(actions.login(user)).toEqual(expected);
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
      actions.login(user);

      expect(window.Raven.setUserContext).toHaveBeenCalledWith(user);
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

  test('closes socket', () => {
    const close = jest.fn();
    window.socket = { close };

    expect.assertions(2);
    return store.dispatch(actions.logout()).then(() => {
      expect(close).toHaveBeenCalled();
      expect(window).not.toHaveProperty('socket');
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
