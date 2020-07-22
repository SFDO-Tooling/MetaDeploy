import { AnyAction, combineReducers, Reducer } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import errors, { ErrorType } from '@/store/errors/reducer';
import jobs, { JobsState } from '@/store/jobs/reducer';
import org, { Org } from '@/store/org/reducer';
import preflights, { PreflightsState } from '@/store/plans/reducer';
import products, { ProductsState } from '@/store/products/reducer';
import socket, { Socket } from '@/store/socket/reducer';
import user, { User } from '@/store/user/reducer';

export type AppState = {
  readonly user: User;
  readonly products: ProductsState;
  readonly preflights: PreflightsState;
  readonly jobs: JobsState;
  readonly org: Org;
  readonly socket: Socket;
  readonly errors: ErrorType[];
};

export type ThunkResult<A = AnyAction | Promise<AnyAction>> = ThunkAction<
  A,
  AppState,
  void,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, void, AnyAction>;

const reducer: Reducer<AppState> = combineReducers({
  user,
  products,
  preflights,
  jobs,
  org,
  socket,
  errors,
});

export default reducer;
