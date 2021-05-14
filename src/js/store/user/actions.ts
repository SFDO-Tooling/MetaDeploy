import { ThunkResult } from '@/store';
import { fetchOrgJobs, FetchOrgJobsSucceeded } from '@/store/org/actions';
import { fetchProducts } from '@/store/products/actions';
import { User } from '@/store/user/reducer';
import apiFetch from '@/utils/api';

type LoginAction = { type: 'USER_LOGGED_IN'; payload: User };
export type LogoutAction = { type: 'USER_LOGGED_OUT' };
export type TokenInvalidAction = { type: 'USER_TOKEN_INVALIDATED' };
export type UserAction = LoginAction | LogoutAction | TokenInvalidAction;
export type RefetchDataAction = {
  type:
    | 'REFETCH_DATA_STARTED'
    | 'REFETCH_DATA_SUCCEEDED'
    | 'REFETCH_DATA_FAILED';
};

export const login = (payload: User): LoginAction => {
  if (window.Sentry) {
    window.Sentry.setUser(payload);
  }

  /* istanbul ignore else */
  if (payload && window.socket) {
    window.socket.subscribe({
      model: 'user',
      id: payload.id,
    });
  }
  return {
    type: 'USER_LOGGED_IN' as const,
    payload,
  };
};

export const logout =
  (): ThunkResult<Promise<FetchOrgJobsSucceeded>> => (dispatch) =>
    apiFetch(window.api_urls.account_logout(), dispatch, {
      method: 'POST',
    }).then(() => {
      /* istanbul ignore else */
      if (window.socket) {
        window.socket.reconnect();
      }
      if (window.Sentry) {
        window.Sentry.configureScope((scope) => scope.clear());
      }
      dispatch({ type: 'USER_LOGGED_OUT' as const });
      dispatch(fetchProducts());
      return dispatch(fetchOrgJobs());
    });

export const invalidateToken = (): TokenInvalidAction => ({
  type: 'USER_TOKEN_INVALIDATED' as const,
});

export const refetchAllData =
  (): ThunkResult<Promise<LoginAction | null>> => async (dispatch) => {
    dispatch({ type: 'REFETCH_DATA_STARTED' as const });
    try {
      const payload = await apiFetch(
        window.api_urls.user(),
        dispatch,
        {},
        [401, 403, 404],
      );
      dispatch({ type: 'REFETCH_DATA_SUCCEEDED' as const });
      dispatch({ type: 'USER_LOGGED_OUT' as const });
      dispatch(fetchOrgJobs());
      if (!payload) {
        return null;
      }
      return dispatch(login(payload));
    } catch (err) {
      dispatch({ type: 'REFETCH_DATA_FAILED' as const });
      throw err;
    }
  };
