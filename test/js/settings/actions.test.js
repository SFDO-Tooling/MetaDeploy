import * as actions from 'settings/actions';

describe('saveActiveTab', () => {
  test('returns TabActiveAction', () => {
    const payload = 'salesforce';
    const expected = {
      type: 'PRODUCTS_TAB_ACTIVE',
      payload,
    };

    expect(actions.saveActiveTab(payload)).toEqual(expected);
  });
});
