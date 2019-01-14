// @flow

import Sockette from 'sockette';

import {
  completeJobStep,
  completeJob,
  failJob,
  simpleCancelJob,
} from 'jobs/actions';
import {
  completePreflight,
  failPreflight,
  invalidatePreflight,
} from 'plans/actions';
import { invalidateToken } from 'user/actions';
import { log } from 'utils/logging';
import { updateOrg } from 'org/actions';

import type { Dispatch } from 'redux-thunk';
import type { Job } from 'jobs/reducer';
import type {
  JobStepCompleted,
  JobCompleted,
  JobFailed,
  JobCanceled,
} from 'jobs/actions';
import type { Org } from 'org/reducer';
import type { OrgChanged } from 'org/actions';
import type { Preflight } from 'plans/reducer';
import type {
  PreflightCompleted,
  PreflightFailed,
  PreflightInvalid,
} from 'plans/actions';
import type { TokenInvalidAction } from 'user/actions';

type SubscriptionEvent = {|
  ok?: string,
  error?: string,
|};
type ErrorEvent = {|
  type: 'BACKEND_ERROR',
  payload: {| message: string |},
|};
type UserEvent = {|
  type: 'USER_TOKEN_INVALID',
|};
type PreflightEvent = {|
  type: 'PREFLIGHT_COMPLETED' | 'PREFLIGHT_FAILED' | 'PREFLIGHT_INVALIDATED',
  payload: Preflight,
|};
type JobEvent = {|
  type: 'TASK_COMPLETED' | 'JOB_COMPLETED' | 'JOB_FAILED' | 'JOB_CANCELED',
  payload: Job,
|};
type OrgEvent = {|
  type: 'ORG_CHANGED',
  payload: Org,
|};
type EventType =
  | SubscriptionEvent
  | ErrorEvent
  | UserEvent
  | PreflightEvent
  | JobEvent
  | OrgEvent;

type Action =
  | TokenInvalidAction
  | PreflightCompleted
  | PreflightFailed
  | PreflightInvalid
  | JobStepCompleted
  | JobCompleted
  | JobFailed
  | JobCanceled
  | OrgChanged;
type Subscription = {| model: string, id: string |};

export const getAction = (event: EventType): Action | null => {
  if (!event || !event.type) {
    return null;
  }
  switch (event.type) {
    case 'USER_TOKEN_INVALID':
      return invalidateToken();
    case 'PREFLIGHT_COMPLETED':
      return completePreflight(event.payload);
    case 'PREFLIGHT_FAILED':
      return failPreflight(event.payload);
    case 'PREFLIGHT_INVALIDATED':
      return invalidatePreflight(event.payload);
    case 'TASK_COMPLETED':
      return completeJobStep(event.payload);
    case 'JOB_COMPLETED':
      return completeJob(event.payload);
    case 'JOB_CANCELED':
      return simpleCancelJob(event.payload);
    case 'JOB_FAILED':
      return failJob(event.payload);
    case 'ORG_CHANGED':
      return updateOrg(event.payload);
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
} = {}): {
  subscribe: (payload: Subscription) => void,
  reconnect: () => void,
} => {
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

  let open = false;
  const pending = new Set();

  const socket = new Sockette(url, {
    protocols: opts.protocols,
    timeout: opts.timeout,
    maxAttempts: opts.maxAttempts,
    onopen: e => {
      log('[WebSocket] connected');
      open = true;
      for (const payload of pending) {
        log('[WebSocket] subscribing to:', payload);
        socket.json(payload);
      }
      pending.clear();
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
      open = false;
      opts.onclose(e);
    },
    onerror: e => {
      log('[WebSocket] error:', e);
      opts.onerror(e);
    },
  });

  const subscribe = (payload: Subscription) => {
    if (open) {
      log('[WebSocket] subscribing to:', payload);
      socket.json(payload);
    } else {
      pending.add(payload);
    }
  };
  const reconnect = () => {
    socket.close(1000, 'user logged out');
    socket.open();
  };

  return {
    subscribe,
    reconnect,
  };
};
