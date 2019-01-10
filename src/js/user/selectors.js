// @flow

import type { AppState } from 'app/reducer';
import type { User } from 'user/reducer';

export const selectUserState = (appState: AppState): User => appState.user;
