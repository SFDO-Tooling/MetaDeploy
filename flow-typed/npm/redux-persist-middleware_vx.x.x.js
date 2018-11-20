// flow-typed signature: 4360764fc58b4082b5047b4fe3258b48
// flow-typed version: <<STUB>>/redux-persist-middleware_v^1.0.1/flow_v0.86.0

declare module 'redux-persist-middleware' {
  declare export default function getPersistMiddleware({
    cacheFn: (string, any) => Promise<void>,
    actionMap: {},
    logger?: any,
  }): any;
}
