// @flow

import { combineReducers } from 'redux';

import productsReducer from 'products/reducer';
import settingsReducer from 'settings/reducer';
import userReducer from 'accounts/reducer';

import type { Products } from 'products/reducer';
import type { Settings } from 'settings/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
  +settings: Settings,
};

const reducer = combineReducers({
  user: userReducer,
  products: productsReducer,
  settings: settingsReducer,
});

export default reducer;
