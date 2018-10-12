// @flow

import type { UserAction } from 'accounts/actions';

export type User = {
  +username: string,
  +email: string,
  +valid_token_for: string | null,
} | null;

const reducer = (user: User = null, action: UserAction): User => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      return action.payload;
    case 'USER_LOGGED_OUT':
      return null;
    case 'USER_TOKEN_INVALIDATED':
      if (user !== null) {
        return { ...user, valid_token_for: null };
      }
      return null;
  }
  return user;
};

export default reducer;
