// @flow

import { combineReducers } from 'redux';

import products from 'products/reducer';
import user from 'accounts/reducer';

import type { Products } from 'products/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
};

const reducer = combineReducers({
  user,
  products,
});

export default reducer;
