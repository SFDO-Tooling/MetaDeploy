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
});

describe('logout', () => {
  afterEach(fetchMock.restore);

  test('POSTs logout then dispatches LogoutAction', () => {
    fetchMock.postOnce(window.URLS.account_logout(), { status: 204, body: {} });
    const store = storeWithApi({});
    const expected = {
      type: 'USER_LOGGED_OUT',
    };

    return store.dispatch(actions.logout()).then(() => {
      expect(store.getActions()).toEqual([expected]);
    });
  });
});
