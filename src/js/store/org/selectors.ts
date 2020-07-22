import type { AppState } from '@/store';
import type { Org } from '@/store/org/reducer';

export const selectOrg = (appState: AppState): Org => appState.org;
