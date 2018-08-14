// @flow

import cookies from 'js-cookie';

import type { User } from 'accounts/reducer';
import type { Dispatch } from 'redux';

type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
type LogoutAction = { type: 'USER_LOGGED_OUT', payload: string };
export type UserAction = LoginAction | LogoutAction;
type GetState = () => { +user: User };
type ThunkAction = (dispatch: Dispatch<UserAction>, getState: GetState) => void;

export const login = (payload: User): LoginAction => ({
  type: 'USER_LOGGED_IN',
  payload,
});

export const logout = (payload: string): ThunkAction => (
  dispatch,
  getState,
) => {
  const state = getState();
  if (state.user && state.user.username === payload) {
    fetch('/accounts/logout/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': cookies.get('csrftoken') || '',
      },
    }).then(response => {
      if (response.ok) {
        dispatch({
          type: 'USER_LOGGED_OUT',
          payload,
        });
      }
    });
  }
};
