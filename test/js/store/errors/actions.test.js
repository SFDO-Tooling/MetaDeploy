import * as actions from '@/store/errors/actions';

describe('addError', () => {
  test('returns AddErrorAction', () => {
    const actual = actions.addError('error message');

    expect(actual.type).toEqual('ERROR_ADDED');
    expect(typeof actual.payload.id).toEqual('string');
    expect(actual.payload.message).toEqual('error message');
  });
});

describe('removeError', () => {
  test('returns RemoveErrorAction', () => {
    const expected = { type: 'ERROR_REMOVED', payload: 'id' };
    const actual = actions.removeError('id');

    expect(actual).toEqual(expected);
  });
});

describe('clearErrors', () => {
  test('returns ClearErrorsAction', () => {
    const expected = { type: 'ERRORS_CLEARED' };
    const actual = actions.clearErrors();

    expect(actual).toEqual(expected);
  });
});
