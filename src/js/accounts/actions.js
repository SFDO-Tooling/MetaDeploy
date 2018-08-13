// @flow

import type { User } from './reducer';

type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
type LogoutAction = { type: 'USER_LOGGED_OUT', payload: string };

export type UserAction = LoginAction | LogoutAction;

export const addToDoItem = (payload: User): LoginAction => ({
  type: 'USER_LOGGED_IN',
  payload,
});
export const removeToDoItem = (payload: string): LogoutAction => ({
  type: 'USER_LOGGED_OUT',
  payload,
});
