import { UserAction } from '@/js/store/user/actions';

export type User = {
  id: string;
  username: string;
  email: string;
  is_staff: boolean;
  valid_token_for: string | null;
  org_name: string | null;
  org_type: string | null;
  is_production_org: boolean;
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
