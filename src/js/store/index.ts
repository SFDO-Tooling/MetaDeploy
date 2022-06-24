import { History } from 'history';
import { AnyAction, combineReducers } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import errors, { ErrorType } from '@/js/store/errors/reducer';
import jobs, { JobsState } from '@/js/store/jobs/reducer';
import orgs, { Orgs } from '@/js/store/org/reducer';
import preflights, { PreflightsState } from '@/js/store/plans/reducer';
import products, { ProductsState } from '@/js/store/products/reducer';
import scratchOrgs, { ScratchOrgState } from '@/js/store/scratchOrgs/reducer';
import socket, { Socket } from '@/js/store/socket/reducer';
import user, { User } from '@/js/store/user/reducer';

export type AppState = {
  readonly user: User;
  readonly products: ProductsState;
  readonly preflights: PreflightsState;
  readonly jobs: JobsState;
  readonly orgs: Orgs;
  readonly scratchOrgs: ScratchOrgState;
  readonly socket: Socket;
  readonly errors: ErrorType[];
};

export type ThunkResult<A = AnyAction | Promise<AnyAction>> = ThunkAction<
  A,
  AppState,
  History,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, History, AnyAction>;

const reducer = combineReducers({
  user,
  products,
  preflights,
  jobs,
  orgs,
  scratchOrgs,
  socket,
  errors,
});

export default reducer;
