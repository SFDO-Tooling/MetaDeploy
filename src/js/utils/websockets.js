// @flow

import Sockette from 'sockette';

import { completeJobStep } from 'jobs/actions';
import {
  completePreflight,
  failPreflight,
  invalidatePreflight,
} from 'plans/actions';
import { invalidateToken } from 'accounts/actions';
import { log } from 'utils/logging';

import type { Dispatch } from 'redux-thunk';
import type { Job } from 'jobs/reducer';
import type { JobStepCompleted } from 'jobs/actions';
import type { Preflight } from 'plans/reducer';
import type {
  PreflightCompleted,
  PreflightFailed,
  PreflightInvalid,
} from 'plans/actions';
import type { TokenInvalidAction } from 'accounts/actions';

const isPreflight = (obj?: Preflight | Job): %checks => obj && obj.results;
const isJob = (obj?: Preflight | Job): %checks => obj && obj.steps;

export const getAction = (
  msg: {
    type?: string,
    payload?: Preflight | Job,
  } = {},
):
  | TokenInvalidAction
  | PreflightCompleted
  | PreflightFailed
  | PreflightInvalid
  | JobStepCompleted
  | null => {
  switch (msg.type) {
    case 'USER_TOKEN_INVALID':
      return invalidateToken();
    case 'PREFLIGHT_COMPLETED':
      return isPreflight(msg.payload) ? completePreflight(msg.payload) : null;
    case 'PREFLIGHT_FAILED':
      return isPreflight(msg.payload) ? failPreflight(msg.payload) : null;
    case 'PREFLIGHT_INVALIDATED':
      return isPreflight(msg.payload) ? invalidatePreflight(msg.payload) : null;
    case 'TASK_COMPLETED':
      return isJob(msg.payload) ? completeJobStep(msg.payload) : null;
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
      let msg = e.data;
      try {
        msg = JSON.parse(e.data);
      } catch (err) {
        // swallow error
      }
      log('[WebSocket] received:', msg);
      const action = getAction(msg);
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
