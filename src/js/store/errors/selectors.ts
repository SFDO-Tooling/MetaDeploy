import { AppState } from '@/store';
import { ErrorType } from '@/store/errors/reducer';

export const selectErrors = (appState: AppState): Array<ErrorType> =>
  appState.errors;
