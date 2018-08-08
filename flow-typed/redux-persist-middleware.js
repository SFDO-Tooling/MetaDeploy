declare module 'redux-persist-middleware' {
  declare export default function getConfiguredCache({
    cacheFn: (string, any) => Promise<void>,
    actionMap: {},
    logger?: any,
  }): any;
}
