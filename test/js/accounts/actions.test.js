import fetchMock from 'fetch-mock';

import { storeWithApi } from './../utils';

import * as actions from 'accounts/actions';
import { cache } from 'utils/caching';

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
    const expected = {
      type: 'USER_LOGGED_IN',
      payload: user,
    };

    expect(actions.login(user)).toEqual(expected);
  });

  test('subscribes to user ws events', () => {
    const user = {
      id: 'user-id',
      username: 'Test User',
      email: 'test@foo.bar',
    };
    actions.login(user);
    const expected = {
      model: 'user',
      id: 'user-id',
    };

    expect(window.socket.subscribe).toHaveBeenCalledWith(expected);
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

describe('doLocalLogout', () => {
  beforeEach(() => {
    window.socket = { reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('returns LogoutAction', () => {
    const expected = {
      type: 'USER_LOGGED_OUT',
    };

    expect(actions.doLocalLogout()).toEqual(expected);
  });

  test('clears cache', () => {
    cache.clear = jest.fn();
    actions.doLocalLogout();

    expect(cache.clear).toHaveBeenCalled();
  });

  test('reconnects socket', () => {
    actions.doLocalLogout();

    expect(window.socket.reconnect).toHaveBeenCalled();
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
      actions.doLocalLogout();

      expect(window.Raven.setUserContext).toHaveBeenCalledWith();
    });
  });
});

describe('logout', () => {
  beforeEach(() => {
    window.socket = { reconnect: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('POSTs logout then dispatches LogoutAction', () => {
    fetchMock.postOnce(window.api_urls.account_logout(), {
      status: 204,
      body: {},
    });
    const store = storeWithApi({});
    const expected = {
      type: 'USER_LOGGED_OUT',
    };

    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([expected]);
    });
  });
});

describe('invalidateToken', () => {
  test('returns TokenInvalidAction', () => {
    const expected = { type: 'USER_TOKEN_INVALIDATED' };

    expect(actions.invalidateToken()).toEqual(expected);
  });
});
