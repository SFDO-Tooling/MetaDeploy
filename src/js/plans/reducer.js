// @flow

import type { PlansAction } from 'plans/actions';

export type Step = {
  +id: number,
  +name: string,
  +kind: string,
  +kind_icon: string | null,
  +is_required: boolean,
  +is_recommended: boolean,
  +description: string,
};
export type Plan = {
  +id: number,
  +slug: string,
  +title: string,
  +preflight_message: string,
  +steps: Array<Step>,
};
export type Plans = Array<Plan>;

export type PreflightError = {
  +status: 'warn' | 'error' | 'skip' | 'optional',
  +message?: string,
};
type PreflightErrors = {
  +plan?: Array<PreflightError>,
  [string]: Array<PreflightError>,
};
export type Preflight = {
  +plan?: number,
  +status: 'started' | 'complete' | 'failed',
  +results?: PreflightErrors,
  +is_valid?: boolean,
  +has_errors?: boolean,
};
export type PreflightsState = {
  [number]: Preflight,
};

const reducer = (
  preflights: PreflightsState = {},
  action: PlansAction,
): PreflightsState => {
  if (action.type === 'FETCH_PREFLIGHT_SUCCEEDED') {
    const { plan, preflight } = action.payload;
    return { ...preflights, [plan]: preflight };
  }
  if (action.type === 'PREFLIGHT_STARTED') {
    const plan = action.payload;
    return { ...preflights, [plan]: { status: 'started' } };
  }
  if (
    action.type === 'PREFLIGHT_COMPLETED' ||
    action.type === 'PREFLIGHT_FAILED' ||
    action.type === 'PREFLIGHT_INVALIDATED'
  ) {
    const preflight = action.payload;
    const { plan } = preflight;
    return { ...preflights, [plan]: preflight };
  }
  return preflights;
};

export default reducer;
