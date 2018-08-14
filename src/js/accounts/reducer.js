// @flow

import type { UserAction } from 'accounts/actions';

export type User = ?{
  +username: string,
  +first_name?: ?string,
  +last_name?: ?string,
  +email?: ?string,
};

const reducer = (state: User = null, action: UserAction): User => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      return action.payload;
    case 'USER_LOGGED_OUT':
      return state && action.payload === state.username ? null : state;
  }
  return state;
};

export default reducer;
