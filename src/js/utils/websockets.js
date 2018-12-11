// @flow

import Sockette from 'sockette';

import { completeJobStep, completeJob } from 'jobs/actions';
import {
  completePreflight,
  failPreflight,
  invalidatePreflight,
} from 'plans/actions';
import { invalidateToken } from 'accounts/actions';
import { log } from 'utils/logging';

import type { Dispatch } from 'redux-thunk';
import type { Job } from 'jobs/reducer';
import type { JobStepCompleted, JobCompleted } from 'jobs/actions';
import type { Preflight } from 'plans/reducer';
import type {
  PreflightCompleted,
  PreflightFailed,
  PreflightInvalid,
} from 'plans/actions';
import type { TokenInvalidAction } from 'accounts/actions';

type Payload = Preflight | Job;

const isPreflight = (obj?: Payload): boolean %checks =>
  obj !== undefined && obj.model_type === 'preflight';
const isJob = (obj?: Payload): boolean %checks =>
  obj !== undefined && obj.model_type === 'job';

export const getAction = (
  event: {
    type?: string,
    payload?: Payload,
  } = {},
):
  | TokenInvalidAction
  | PreflightCompleted
  | PreflightFailed
  | PreflightInvalid
  | JobStepCompleted
  | JobCompleted
  | null => {
  switch (event.type) {
    case 'USER_TOKEN_INVALID':
      return invalidateToken();
    case 'PREFLIGHT_COMPLETED':
      return isPreflight(event.payload)
        ? completePreflight(event.payload)
        : null;
    case 'PREFLIGHT_FAILED':
      return isPreflight(event.payload) ? failPreflight(event.payload) : null;
    case 'PREFLIGHT_INVALIDATED':
      return isPreflight(event.payload)
        ? invalidatePreflight(event.payload)
        : null;
    case 'TASK_COMPLETED':
      return isJob(event.payload) ? completeJobStep(event.payload) : null;
    case 'JOB_COMPLETED':
      return isJob(event.payload) ? completeJob(event.payload) : null;
  }
  return null;
};

export const createSocket = ({
  url,
  options,
  dispatch,
}: {
  url: string,
  options?: { [string]: mixed },
  dispatch: Dispatch,
}): Sockette => {
  const defaults = {
    maxAttempts: 25,
    onopen: () => {},
    onmessage: () => {},
    onreconnect: () => {},
    onmaximum: () => {},
    onclose: () => {},
    onerror: () => {},
  };
  const opts = { ...defaults, ...options };

  return new Sockette(url, {
    protocols: opts.protocols,
    timeout: opts.timeout,
    maxAttempts: opts.maxAttempts,
    onopen: e => {
      log('[WebSocket] connected');
      opts.onopen(e);
    },
    onmessage: e => {
      let data = e.data;
      try {
        data = JSON.parse(e.data);
      } catch (err) {
        // swallow error
      }
      log('[WebSocket] received:', data);
      const action = getAction(data);
      if (action) {
        dispatch(action);
      }
      opts.onmessage(e);
    },
    onreconnect: e => {
      log('[WebSocket] reconnecting...');
      opts.onreconnect(e);
    },
    onmaximum: e => {
      log(`[WebSocket] ending reconnect after ${opts.maxAttempts} attempts`);
      opts.onmaximum(e);
    },
    onclose: e => {
      log('[WebSocket] closed');
      opts.onclose(e);
    },
    onerror: e => {
      log('[WebSocket] error:', e);
      opts.onerror(e);
    },
  });
};
