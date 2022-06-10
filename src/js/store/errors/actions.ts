import uuid from 'uuid-random';

import { ErrorType } from '@/js/store/errors/reducer';

type AddErrorAction = { type: 'ERROR_ADDED'; payload: ErrorType };
type RemoveErrorAction = { type: 'ERROR_REMOVED'; payload: string };
type ClearErrorsAction = { type: 'ERRORS_CLEARED' };
export type ErrorAction =
  | AddErrorAction
  | RemoveErrorAction
  | ClearErrorsAction;

export const addError = (msg: string): AddErrorAction => ({
  type: 'ERROR_ADDED',
  payload: {
    id: uuid(),
    message: msg,
  },
});

export const removeError = (id: string): RemoveErrorAction => ({
  type: 'ERROR_REMOVED',
  payload: id,
});

export const clearErrors = (): ClearErrorsAction => ({
  type: 'ERRORS_CLEARED',
});
