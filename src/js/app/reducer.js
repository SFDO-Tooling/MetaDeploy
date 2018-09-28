// @flow

import { combineReducers } from 'redux';

import products from 'products/reducer';
import settings from 'settings/reducer';
import user from 'accounts/reducer';

import type { Products } from 'products/reducer';
import type { Settings } from 'settings/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
  +settings: Settings,
};

const reducer = combineReducers({
  user,
  products,
  settings,
});

export default reducer;
