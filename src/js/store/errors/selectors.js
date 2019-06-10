// @flow

import type { AppState } from 'store';
import type { ErrorType } from 'store/errors/reducer';

export const selectErrors = (appState: AppState): Array<ErrorType> =>
  appState.errors;
