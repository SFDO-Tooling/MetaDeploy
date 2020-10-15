import { ThunkDispatch } from 'redux-thunk';
import Sockette from 'sockette';

import { ThunkResult } from '@/store';
import {
  cancelJob,
  completeJob,
  completeJobStep,
  createJob,
  failJob,
  JobCanceled,
  JobCompleted,
  JobFailed,
  JobStarted,
  JobStepCompleted,
} from '@/store/jobs/actions';
import { Job } from '@/store/jobs/reducer';
import { OrgChanged, updateOrg } from '@/store/org/actions';
import { Org } from '@/store/org/reducer';
import {
  cancelPreflight,
  completePreflight,
  failPreflight,
  invalidatePreflight,
  PreflightCanceled,
  PreflightCompleted,
  PreflightFailed,
  PreflightInvalid,
  PreflightStarted,
} from '@/store/plans/actions';
import { Preflight } from '@/store/plans/reducer';
import {
  createPreflight,
  createScratchOrg,
  failScratchOrg,
  ScratchOrgCreated,
  ScratchOrgFailed,
} from '@/store/scratchOrgs/actions';
import { ScratchOrg } from '@/store/scratchOrgs/reducer';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import { invalidateToken, TokenInvalidAction } from '@/store/user/actions';
import { log } from '@/utils/logging';

interface Subscription {
  model: string;
  id: string;
  uuid?: string;
}

export interface Socket {
  subscribe: (payload: Subscription) => void;
  reconnect: () => void;
}

interface SubscriptionEvent {
  ok?: string;
  error?: string;
}
interface ErrorEvent {
  type: 'BACKEND_ERROR';
  payload: { message: string };
}
interface UserEvent {
  type: 'USER_TOKEN_INVALID';
}
interface PreflightEvent {
  type:
    | 'PREFLIGHT_STARTED'
    | 'PREFLIGHT_COMPLETED'
    | 'PREFLIGHT_FAILED'
    | 'PREFLIGHT_CANCELED'
    | 'PREFLIGHT_INVALIDATED';
  payload: Preflight;
}
interface JobEvent {
  type: 'TASK_COMPLETED' | 'JOB_COMPLETED' | 'JOB_FAILED' | 'JOB_CANCELED';
  payload: Job;
}
interface JobStartedEvent {
  type: 'JOB_STARTED';
  payload: {
    model: Job;
    product_slug: string;
    version_label: string;
    plan_slug: string;
  };
}
interface OrgEvent {
  type: 'ORG_CHANGED';
  payload: Org;
}

interface ScratchOrgCreatedEvent {
  type: 'SCRATCH_ORG_CREATED';
  payload: ScratchOrg;
}

interface ScratchOrgErrorEvent {
  type: 'SCRATCH_ORG_ERROR';
  payload: {
    message: string;
    org: ScratchOrg;
  };
}

type ModelEvent =
  | UserEvent
  | PreflightEvent
  | JobEvent
  | OrgEvent
  | ScratchOrgCreatedEvent
  | ScratchOrgErrorEvent
  | JobStartedEvent;
type EventType = SubscriptionEvent | ErrorEvent | ModelEvent;

type Action =
  | TokenInvalidAction
  | PreflightStarted
  | PreflightCompleted
  | PreflightFailed
  | PreflightCanceled
  | PreflightInvalid
  | JobStepCompleted
  | JobCompleted
  | JobFailed
  | JobCanceled
  | OrgChanged
  | ScratchOrgCreated
  | ThunkResult<JobStarted>
  | ThunkResult<ScratchOrgFailed>;

const isSubscriptionEvent = (event: EventType): event is SubscriptionEvent =>
  (event as ModelEvent).type === undefined;

export const getAction = (event: EventType): Action | null => {
  if (!event || isSubscriptionEvent(event)) {
    return null;
  }
  switch (event.type) {
    case 'USER_TOKEN_INVALID':
      return invalidateToken();
    case 'PREFLIGHT_COMPLETED':
      return completePreflight(event.payload);
    case 'PREFLIGHT_FAILED':
      return failPreflight(event.payload);
    case 'PREFLIGHT_CANCELED':
      return cancelPreflight(event.payload);
    case 'PREFLIGHT_INVALIDATED':
      return invalidatePreflight(event.payload);
    case 'TASK_COMPLETED':
      return completeJobStep(event.payload);
    case 'JOB_COMPLETED':
      return completeJob(event.payload);
    case 'JOB_CANCELED':
      return cancelJob(event.payload);
    case 'JOB_FAILED':
      return failJob(event.payload);
    case 'ORG_CHANGED':
      return updateOrg(event.payload);
    case 'SCRATCH_ORG_CREATED':
      return createScratchOrg(event.payload);
    case 'SCRATCH_ORG_ERROR':
      return failScratchOrg(event.payload);
    case 'PREFLIGHT_STARTED':
      return createPreflight(event.payload);
    case 'JOB_STARTED':
      return createJob(event.payload);
  }
  return null;
};

export const createSocket = ({
  url,
  options = {},
  dispatch,
}: {
  url: string;
  options?: {
    [key: string]: any;
  };
  dispatch: ThunkDispatch<any, any, any>;
}): Socket | null => {
  /* istanbul ignore if */
  if (!(url && dispatch)) {
    return null;
  }
  const defaults = {
    timeout: 1000,
    maxAttempts: Infinity,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    onopen: (e?: Event) => {},
    onmessage: (e?: Event) => {},
    onreconnect: (e?: Event) => {},
    onmaximum: (e?: Event) => {},
    onclose: (e?: Event) => {},
    onerror: (e?: Event) => {},
    /* eslint-enable @typescript-eslint/no-unused-vars */
  };
  const opts = { ...defaults, ...options };

  let open = false;
  let lostConnection = false;
  const pending = new Set();

  const socket = new Sockette(url, {
    timeout: opts.timeout,
    maxAttempts: opts.maxAttempts,
    onopen: (e) => {
      dispatch(connectSocket());
      open = true;
      for (const payload of pending) {
        log('[WebSocket] subscribing to:', payload);
        socket.json(payload);
      }
      pending.clear();
      if (lostConnection) {
        lostConnection = false;
        log('[WebSocket] reconnected');
        opts.onreconnect(e);
      } else {
        log('[WebSocket] connected');
        opts.onopen(e);
      }
    },
    onmessage: (e) => {
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
    onreconnect: () => {
      log('[WebSocket] attempting to reconnect…');
      if (!lostConnection) {
        lostConnection = true;
      }
    },
    onmaximum: (e) => {
      log(`[WebSocket] ending reconnect after ${opts.maxAttempts} attempts`);
      opts.onmaximum(e);
    },
    onclose: (e) => {
      log('[WebSocket] closed');
      if (open) {
        open = false;
        setTimeout(() => {
          if (!open) {
            dispatch(disconnectSocket());
          }
        }, 5000);
      }
      opts.onclose(e);
    },
    onerror: (e) => {
      log('[WebSocket] error');
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

  let reconnecting: NodeJS.Timeout | undefined;
  const clearReconnect = () => {
    /* istanbul ignore else */
    if (reconnecting) {
      clearInterval(reconnecting);
      reconnecting = undefined;
    }
  };

  const reconnect = () => {
    socket.close(1000, 'user logged out');
    // Without polling, the `onopen` callback after reconnect could fire before
    // the `onclose` callback...
    reconnecting = setInterval(() => {
      if (!open) {
        socket.open();
        clearReconnect();
      }
    }, 500);
  };

  return {
    subscribe,
    reconnect,
  };
};
