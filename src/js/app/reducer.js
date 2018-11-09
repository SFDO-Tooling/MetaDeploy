// @flow

import { combineReducers } from 'redux';

import jobs from 'jobs/reducer';
import preflights from 'plans/reducer';
import products from 'products/reducer';
import user from 'accounts/reducer';

import type { CombinedReducer } from 'redux';
import type { JobsState } from 'jobs/reducer';
import type { PreflightsState } from 'plans/reducer';
import type { Products } from 'products/reducer';
import type { User } from 'accounts/reducer';

export type AppState = {
  +user: User,
  +products: Products,
  +preflights: PreflightsState,
  +jobs: JobsState,
};

type Action = { +type: string };

const reducer: CombinedReducer<AppState, Action> = combineReducers({
  user,
  products,
  preflights,
  jobs,
});

export default reducer;
