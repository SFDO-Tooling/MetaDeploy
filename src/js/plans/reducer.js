// @flow

import type { LogoutAction } from 'accounts/actions';
import type { PlansAction } from 'plans/actions';

export type Step = {|
  +id: string,
  +name: string,
  +kind: string,
  +kind_icon: string | null,
  +is_required: boolean,
  +is_recommended: boolean,
  +description: string,
|};
export type Plan = {
  +id: string,
  +slug: string,
  +title: string,
  +preflight_message: string,
  +steps: Array<Step>,
  +is_listed: boolean,
};
export type Plans = Array<Plan>;

export type StepResult = {|
  +status: 'ok' | 'warn' | 'error' | 'skip' | 'optional',
  +message?: string,
|};
export type PreflightErrors = {|
  +plan?: Array<StepResult>,
  [string]: Array<StepResult>,
|};
export type Preflight = {|
  +id: string | null,
  +edited_at: string | null,
  +plan: string,
  +status: 'started' | 'complete' | 'failed',
  +results: PreflightErrors,
  +is_valid: boolean,
  +error_count: number,
  +warning_count: number,
  +is_ready: boolean,
|};
export type PreflightsState = {
  [string]: Preflight,
};

export const CONSTANTS = {
  STATUS: {
    STARTED: 'started',
    COMPLETE: 'complete',
    FAILED: 'failed',
  },
  RESULT_STATUS: {
    OK: 'ok',
    WARN: 'warn',
    ERROR: 'error',
    SKIP: 'skip',
    OPTIONAL: 'optional',
  },
};

const reducer = (
  preflights: PreflightsState = {},
  action: PlansAction | LogoutAction,
): PreflightsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'PREFLIGHT_STARTED': {
      const plan = action.payload;
      return {
        ...preflights,
        [plan]: {
          id: null,
          edited_at: null,
          plan,
          status: CONSTANTS.STATUS.STARTED,
          results: {},
          is_valid: true,
          error_count: 0,
          warning_count: 0,
          is_ready: false,
        },
      };
    }
    case 'FETCH_PREFLIGHT_SUCCEEDED': {
      const { plan, preflight } = action.payload;
      return { ...preflights, [plan]: preflight };
    }
    case 'PREFLIGHT_COMPLETED':
    case 'PREFLIGHT_FAILED':
    case 'PREFLIGHT_INVALIDATED': {
      const preflight = action.payload;
      const { plan } = preflight;
      const existingPreflight = preflights[plan];
      if (
        !existingPreflight ||
        !existingPreflight.edited_at ||
        !preflight.edited_at ||
        preflight.edited_at > existingPreflight.edited_at
      ) {
        return { ...preflights, [plan]: preflight };
      }
      return preflights;
    }
  }
  return preflights;
};

export default reducer;
