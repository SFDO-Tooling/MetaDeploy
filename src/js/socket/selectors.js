// @flow

import type { AppState } from 'app/reducer';
import type { Socket } from 'socket/reducer';

export const selectSocketState = (appState: AppState): Socket =>
  appState.socket;
