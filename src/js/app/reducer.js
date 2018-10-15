// @flow

import { combineReducers } from 'redux';

import plans from 'plans/reducer';
import products from 'products/reducer';
import user from 'accounts/reducer';

import type { PlansState } from 'plans/reducer';
import type { Products } from 'products/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
  +plans: PlansState,
};

const reducer = combineReducers({
  user,
  products,
  plans,
});

export default reducer;
