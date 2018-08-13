// @flow

import getPersistMiddleware from 'redux-persist-middleware';
import { getConfiguredCache } from 'money-clip';

export const cache = getConfiguredCache({
  version: '0.1.0',
});

const actionsToPersist = {
  USER_LOGGED_IN: ['user'],
  USER_LOGGED_OUT: ['user'],
};

export const persistMiddleware = getPersistMiddleware({
  cacheFn: cache.set,
  logger: console.info, // eslint-disable-line no-console
  actionMap: actionsToPersist,
});
