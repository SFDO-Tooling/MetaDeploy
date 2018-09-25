// @flow

import { combineReducers } from 'redux';

import userReducer from 'accounts/reducer';
import productsReducer from 'products/reducer';

import type { Products } from 'products/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
};

const reducer = combineReducers({
  user: userReducer,
  products: productsReducer,
});

export default reducer;
