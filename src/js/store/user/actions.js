// @flow

import type { ThunkAction } from 'redux-thunk';

import { fetchOrgJobs } from 'store/org/actions';
import { fetchProducts } from 'store/products/actions';
import type { User } from 'store/user/reducer';

type LoginAction = { type: 'USER_LOGGED_IN', payload: User };
export type LogoutAction = { type: 'USER_LOGGED_OUT' };
export type TokenInvalidAction = { type: 'USER_TOKEN_INVALIDATED' };
export type UserAction = LoginAction | LogoutAction | TokenInvalidAction;

export const login = (payload: User): ThunkAction => dispatch => {
  if (window.Raven && window.Raven.isSetup()) {
    window.Raven.setUserContext(payload);
  }
  /* istanbul ignore else */
  if (payload && window.socket) {
    window.socket.subscribe({
      model: 'user',
      id: payload.id,
    });
    if (payload.valid_token_for) {
      window.socket.subscribe({
        model: 'org',
        id: payload.valid_token_for,
      });
    }
  }
  dispatch({
    type: 'USER_LOGGED_IN',
    payload,
  });
  return dispatch(fetchOrgJobs());
};

export const logout = (): ThunkAction => (dispatch, getState, { apiFetch }) =>
  apiFetch(window.api_urls.account_logout(), {
    method: 'POST',
  }).then(() => {
    /* istanbul ignore else */
    if (window.socket) {
      window.socket.reconnect();
    }
    if (window.Raven && window.Raven.isSetup()) {
      window.Raven.setUserContext();
    }
    dispatch({ type: 'USER_LOGGED_OUT' });
    return dispatch(fetchProducts());
  });

export const invalidateToken = (): TokenInvalidAction => ({
  type: 'USER_TOKEN_INVALIDATED',
});

export const refetchAllData = (): ThunkAction => (
  dispatch,
  getState,
  { apiFetch },
) => {
  dispatch({ type: 'REFETCH_DATA_STARTED' });
  return apiFetch(window.api_urls.user())
    .then(payload => {
      dispatch({ type: 'REFETCH_DATA_SUCCEEDED' });
      dispatch({ type: 'USER_LOGGED_OUT' });
      if (!payload) {
        return null;
      }
      return dispatch(login(payload));
    })
    .catch(err => {
      dispatch({ type: 'REFETCH_DATA_FAILED' });
      throw err;
    });
};
