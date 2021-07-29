import { AppState } from '@/js/store';
import { Orgs } from '@/js/store/org/reducer';

export const selectOrgs = (appState: AppState): Orgs => appState.orgs;
