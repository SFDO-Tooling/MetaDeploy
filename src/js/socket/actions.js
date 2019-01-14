// @flow

export type SocketDisconnected = { type: 'SOCKET_DISCONNECTED' };
export type SocketConnected = { type: 'SOCKET_CONNECTED' };
export type SocketAction = SocketConnected | SocketDisconnected;
