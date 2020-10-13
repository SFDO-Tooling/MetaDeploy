import { connectRouter, RouterState } from 'connected-react-router';
import { History } from 'history';
import { AnyAction, combineReducers } from 'redux';
import { ThunkAction, ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';

import errors, { ErrorType } from '@/store/errors/reducer';
import jobs, { JobsState } from '@/store/jobs/reducer';
import orgs, { Orgs } from '@/store/org/reducer';
import preflights, { PreflightsState } from '@/store/plans/reducer';
import products, { ProductsState } from '@/store/products/reducer';
import scratchOrgs, { ScratchOrgState } from '@/store/scratchOrgs/reducer';
import socket, { Socket } from '@/store/socket/reducer';
import user, { User } from '@/store/user/reducer';

export type AppState = {
  readonly router: RouterState;
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
  void,
  AnyAction
>;
export type ThunkDispatch = ReduxThunkDispatch<AppState, void, AnyAction>;

const createRootReducer = (history: History) =>
  combineReducers({
    router: connectRouter(history),
    user,
    products,
    preflights,
    jobs,
    orgs,
    scratchOrgs,
    socket,
    errors,
  });

export default createRootReducer;
