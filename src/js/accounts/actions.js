// @flow

import { cache } from 'utils/caching';

import type { User } from 'accounts/reducer';
import type { DispatchAPI } from 'redux';

/* eslint-disable no-use-before-define */
type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
type LogoutAction = { type: 'USER_LOGGED_OUT' };
export type UserAction = LoginAction | LogoutAction;
type GetState = () => { +user: User };
type PromiseAction = Promise<UserAction>;
type Dispatch = (
  action: UserAction | ThunkAction | PromiseAction | Array<UserAction>,
) => DispatchAPI<UserAction | ThunkAction>;
type ThunkAction = (dispatch: Dispatch, getState: GetState, opts: any) => any;
/* eslint-enable no-use-before-define */

export const login = (payload: User): LoginAction => ({
  type: 'USER_LOGGED_IN',
  payload,
});

export const doLocalLogout = (): LogoutAction => {
  cache.clear();
  return {
    type: 'USER_LOGGED_OUT',
  };
};

export const logout = (): ThunkAction => (dispatch, getState, { apiFetch }) =>
  apiFetch('/accounts/logout/', {
    method: 'POST',
  }).then(() => dispatch(doLocalLogout()));
