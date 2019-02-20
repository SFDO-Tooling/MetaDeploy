// @flow

import { combineReducers } from 'redux';
import type { CombinedReducer } from 'redux';

import jobs from 'store/jobs/reducer';
import org from 'store/org/reducer';
import preflights from 'store/plans/reducer';
import products from 'store/products/reducer';
import socket from 'store/socket/reducer';
import user from 'store/user/reducer';
import type { JobsState } from 'store/jobs/reducer';
import type { Org } from 'store/org/reducer';
import type { PreflightsState } from 'store/plans/reducer';
import type { Products } from 'store/products/reducer';
import type { Socket } from 'store/socket/reducer';
import type { User } from 'store/user/reducer';

export type AppState = {
  +user: User,
  +products: Products,
  +preflights: PreflightsState,
  +jobs: JobsState,
  +org: Org,
  +socket: Socket,
};

type Action = { +type: string };

const reducer: CombinedReducer<AppState, Action> = combineReducers({
  user,
  products,
  preflights,
  jobs,
  org,
  socket,
});

export default reducer;
