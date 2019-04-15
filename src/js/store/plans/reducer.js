// @flow

import type { LogoutAction } from 'store/user/actions';
import type { PlansAction } from 'store/plans/actions';

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
  +old_slugs: string[],
  +title: string,
  +preflight_message: string | null,
  +steps: Array<Step> | null,
  +is_listed: boolean,
  +is_allowed: boolean,
  +not_allowed_instructions: string | null,
};
export type Plans = Array<Plan>;

export type StepResult = {|
  +status: 'ok' | 'warn' | 'error' | 'skip' | 'optional',
  +message?: string,
  +logs?: string,
|};
export type PreflightErrors = {|
  +plan?: StepResult,
  [string]: StepResult,
|};
export type Preflight = {|
  +id: string,
  +edited_at: string,
  +user: string,
  +plan: string,
  +status: 'started' | 'complete' | 'failed' | 'canceled',
  +results: PreflightErrors,
  +is_valid: boolean,
  +error_count: number,
  +warning_count: number,
  +is_ready: boolean,
|};
export type PreflightsState = {
  [string]: Preflight,
};

type Constants = {|
  STATUS: {|
    STARTED: 'started',
    COMPLETE: 'complete',
    FAILED: 'failed',
    CANCELED: 'canceled',
  |},
  RESULT_STATUS: {|
    OK: 'ok',
    WARN: 'warn',
    ERROR: 'error',
    SKIP: 'skip',
    OPTIONAL: 'optional',
  |},
  AUTO_START_PREFLIGHT: 'start_preflight',
|};

export const CONSTANTS: Constants = {
  STATUS: {
    STARTED: 'started',
    COMPLETE: 'complete',
    FAILED: 'failed',
    CANCELED: 'canceled',
  },
  RESULT_STATUS: {
    OK: 'ok',
    WARN: 'warn',
    ERROR: 'error',
    SKIP: 'skip',
    OPTIONAL: 'optional',
  },
  AUTO_START_PREFLIGHT: 'start_preflight',
};

const reducer = (
  preflights: PreflightsState = {},
  action: PlansAction | LogoutAction,
): PreflightsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return {};
    case 'FETCH_PREFLIGHT_SUCCEEDED': {
      const { plan, preflight } = action.payload;
      return { ...preflights, [plan]: preflight };
    }
    case 'PREFLIGHT_STARTED':
    case 'PREFLIGHT_COMPLETED':
    case 'PREFLIGHT_FAILED':
    case 'PREFLIGHT_CANCELED':
    case 'PREFLIGHT_INVALIDATED': {
      const preflight = action.payload;
      const { plan } = preflight;
      const existingPreflight = preflights[plan];
      if (
        !existingPreflight ||
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
