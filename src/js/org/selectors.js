// @flow

import type { AppState } from 'app/reducer';
import type { Org } from 'org/reducer';

export const selectOrg = (appState: AppState): Org => appState.org;
