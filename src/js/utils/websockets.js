// @flow

import Sockette from 'sockette';

import { invalidateToken } from 'accounts/actions';
import { log } from 'utils/logging';

import type { Dispatch } from 'redux-thunk';
import type { TokenInvalidAction } from 'accounts/actions';

export const getAction = (
  msg: {
    [string]: mixed,
  } = {},
): TokenInvalidAction | null => {
  switch (msg.type) {
    case 'USER_TOKEN_INVALID':
      return invalidateToken();
  }
  return null;
};

export const createSocket = ({
  url,
  options,
  dispatch,
}: {
  url: string,
  options?: { [string]: mixed },
  dispatch: Dispatch,
}): Sockette => {
  const defaults = {
    maxAttempts: 25,
    onopen: () => {},
    onmessage: () => {},
    onreconnect: () => {},
    onmaximum: () => {},
    onclose: () => {},
    onerror: () => {},
  };
  const opts = { ...defaults, ...options };

  return new Sockette(url, {
    protocols: opts.protocols,
    timeout: opts.timeout,
    maxAttempts: opts.maxAttempts,
    onopen: e => {
      log('[WebSocket] connected');
      opts.onopen(e);
    },
    onmessage: e => {
      let msg = e.data;
      try {
        msg = JSON.parse(e.data);
      } catch (err) {
        // swallow error
      }
      log('[WebSocket] received:', msg);
      const action = getAction(msg);
      if (action) {
        dispatch(action);
      }
      opts.onmessage(e);
    },
    onreconnect: e => {
      log('[WebSocket] reconnecting...');
      opts.onreconnect(e);
    },
    onmaximum: e => {
      log(`[WebSocket] ending reconnect after ${opts.maxAttempts} attempts`);
      opts.onmaximum(e);
    },
    onclose: e => {
      log('[WebSocket] closed');
      opts.onclose(e);
    },
    onerror: e => {
      log('[WebSocket] error:', e);
      opts.onerror(e);
    },
  });
};
