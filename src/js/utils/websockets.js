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

type ErrorPayload = {| +message: string |};
export type JobStepCompletedPayload = {| +step_id: string, +job: Job |};
type Payload = ErrorPayload | Preflight | Job | JobStepCompletedPayload;

const isPreflight = (obj?: Payload): %checks => obj && obj.results;
const isJob = (obj?: Payload): %checks => obj && obj.steps;
const isJobStep = (obj?: Payload): %checks => obj && obj.step_id && obj.job;

export const getAction = (
  msg: {
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
      return isJobStep(msg.payload) ? completeJobStep(msg.payload) : null;
    case 'JOB_COMPLETED':
      return isJob(msg.payload) ? completeJob(msg.payload) : null;
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
