declare module 'redux-thunk' {
  import type { DispatchAPI } from 'redux';

  declare type Action = { +type: string };
  declare type GetState = () => any;
  declare type PromiseAction = Promise<Action>;
  declare type Dispatch = (
    action: Action | ThunkAction | PromiseAction | Array<Action>,
  ) => DispatchAPI<Action | ThunkAction>;
  declare export type ThunkAction = (
    dispatch: Dispatch,
    getState: GetState,
    opts: any,
  ) => any;

  declare export default function thunk(): any;
}
