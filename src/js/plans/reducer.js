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
  +status: 'warning' | 'error' | 'skipped',
  +message?: string,
};
type PreflightErrors = {
  +plan_errors?: Array<PreflightError>,
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
  switch (action.type) {
    case 'FETCH_PREFLIGHT_SUCCEEDED': {
      const { plan, preflight } = action.payload;
      return { ...preflights, [plan]: preflight };
    }
    case 'PREFLIGHT_STARTED': {
      const plan = action.payload;
      return { ...preflights, [plan]: { status: 'started' } };
    }
    case 'PREFLIGHT_COMPLETED': {
      const preflight = action.payload;
      const { plan } = preflight;
      return { ...preflights, [plan]: preflight };
    }
    case 'PREFLIGHT_FAILED': {
      const preflight = action.payload;
      const { plan } = preflight;
      return { ...preflights, [plan]: preflight };
    }
  }
  return preflights;
};

export default reducer;
