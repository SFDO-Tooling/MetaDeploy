// @flow

import getPersistMiddleware from 'redux-persist-middleware';
import { getConfiguredCache } from 'money-clip';

export const cache = getConfiguredCache({
  version: 'metadeploy-0.1.0',
});

const actionsToPersist = {
  FETCH_PRODUCTS_SUCCEEDED: ['products'],
};

export const persistMiddleware = getPersistMiddleware({
  cacheFn: cache.set,
  logger: window.console.info,
  actionMap: actionsToPersist,
});
