import { AppState } from '@/store';
import { Orgs } from '@/store/org/reducer';

export const selectOrgs = (appState: AppState): Orgs => appState.orgs;
