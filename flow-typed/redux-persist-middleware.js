declare module 'redux-persist-middleware' {
  declare export default function getPersistMiddleware({
    cacheFn: (string, any) => Promise<void>,
    actionMap: {},
    logger?: any,
  }): any;
}
