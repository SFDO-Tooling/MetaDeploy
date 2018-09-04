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

describe('doLocalLogout', () => {
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
  afterEach(fetchMock.restore);

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
