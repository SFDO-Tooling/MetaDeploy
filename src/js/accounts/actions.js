// @flow

import { cache } from 'utils/caching';
import { createSocket } from 'utils/websockets';

import type { ThunkAction } from 'redux-thunk';
import type { User } from 'accounts/reducer';

type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
type LogoutAction = { type: 'USER_LOGGED_OUT' };
export type UserAction = LoginAction | LogoutAction;

export const login = (payload: User): LoginAction => {
  if (window.Raven && window.Raven.isSetup()) {
    window.Raven.setUserContext(payload);
  }
  // @@@
  window.ws = createSocket();
  return {
    type: 'USER_LOGGED_IN',
    payload,
  };
};

export const doLocalLogout = (): LogoutAction => {
  cache.clear();
  if (window.Raven && window.Raven.isSetup()) {
    window.Raven.setUserContext();
  }
  return {
    type: 'USER_LOGGED_OUT',
  };
};

export const logout = (): ThunkAction => (dispatch, getState, { apiFetch }) =>
  apiFetch(window.api_urls.account_logout(), {
    method: 'POST',
  }).then(() => dispatch(doLocalLogout()));
