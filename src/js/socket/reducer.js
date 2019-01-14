// @flow

import type { SocketAction } from 'socket/actions';

export type Socket = {
  +connected: boolean,
} | null;

const reducer = (socket: Socket = null, action: SocketAction): Socket => {
  switch (action.type) {
    case 'SOCKET_DISCONNECTED':
      return { connected: false };
    case 'SOCKET_CONNECTED':
      return { connected: true };
  }
  return socket;
};

export default reducer;
