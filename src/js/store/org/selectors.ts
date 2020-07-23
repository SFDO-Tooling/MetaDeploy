import { AppState } from '@/store';
import { Org } from '@/store/org/reducer';

export const selectOrg = (appState: AppState): Org => appState.org;
