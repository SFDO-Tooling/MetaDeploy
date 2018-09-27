// @flow

import type { SettingsAction } from 'settings/actions';

export type ActiveProductsTab = string | null;
export type Settings = {
  +activeProductsTab: ActiveProductsTab,
};

const initialState = {
  activeProductsTab: null,
};

const reducer = (
  state: Settings = initialState,
  action: SettingsAction,
): Settings => {
  switch (action.type) {
    case 'PRODUCTS_TAB_ACTIVE':
      return { ...state, activeProductsTab: action.payload };
  }
  return state;
};

export default reducer;
