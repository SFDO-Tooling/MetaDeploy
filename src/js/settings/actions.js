// @flow

import type { ActiveProductsTab } from 'settings/reducer';

type TabActiveAction = {
  type: 'PRODUCTS_TAB_ACTIVE',
  payload: ActiveProductsTab,
};
export type SettingsAction = TabActiveAction;

export const saveActiveTab = (payload: ActiveProductsTab): TabActiveAction => ({
  type: 'PRODUCTS_TAB_ACTIVE',
  payload,
});
