import Sockette from 'sockette';

import * as sockets from 'utils/websockets';
import { completeJobStep, completeJob, failJob, cancelJob } from 'jobs/actions';
import {
  completePreflight,
  failPreflight,
  invalidatePreflight,
} from 'plans/actions';
import { connectSocket, disconnectSocket } from 'socket/actions';
import { invalidateToken } from 'user/actions';
import { updateOrg } from 'org/actions';

const mockJson = jest.fn();
const mockClose = jest.fn();
const mockOpen = jest.fn();
jest.mock('sockette', () =>
  jest.fn().mockImplementation(() => ({
    json: mockJson,
    close: mockClose,
    open: mockOpen,
  })),
);

describe('getAction', () => {
  test('handles USER_TOKEN_INVALID msg', () => {
    const msg = { type: 'USER_TOKEN_INVALID' };
    const expected = invalidateToken();
    const actual = sockets.getAction(msg);

    expect(actual).toEqual(expected);
  });

  describe('PREFLIGHT_COMPLETED', () => {
    test('handles msg', () => {
      const preflight = { status: 'complete', results: {} };
      const msg = { type: 'PREFLIGHT_COMPLETED', payload: preflight };
      const expected = completePreflight(preflight);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('PREFLIGHT_FAILED', () => {
    test('handles msg', () => {
      const preflight = { status: 'complete', results: {} };
      const msg = { type: 'PREFLIGHT_FAILED', payload: preflight };
      const expected = failPreflight(preflight);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('PREFLIGHT_INVALIDATED', () => {
    test('handles msg', () => {
      const preflight = { status: 'complete', results: {} };
      const msg = { type: 'PREFLIGHT_INVALIDATED', payload: preflight };
      const expected = invalidatePreflight(preflight);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('TASK_COMPLETED', () => {
    test('handles msg', () => {
      const payload = { id: 'job-1', steps: ['step-1'], results: {} };
      const msg = { type: 'TASK_COMPLETED', payload };
      const expected = completeJobStep(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('JOB_COMPLETED', () => {
    test('handles msg', () => {
      const payload = { id: 'job-1', steps: ['step-1'] };
      const msg = { type: 'JOB_COMPLETED', payload };
      const expected = completeJob(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('JOB_FAILED', () => {
    test('handles msg', () => {
      const payload = { id: 'job-1', steps: ['step-1'] };
      const msg = { type: 'JOB_FAILED', payload };
      const expected = failJob(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('JOB_CANCELED', () => {
    test('handles msg', () => {
      const payload = { id: 'job-1', steps: ['step-1'] };
      const msg = { type: 'JOB_CANCELED', payload };
      const expected = cancelJob(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('ORG_CHANGED', () => {
    test('handles msg', () => {
      const payload = { current_job: 'id', current_preflight: null };
      const msg = { type: 'ORG_CHANGED', payload };
      const expected = updateOrg(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  test('handles unknown msg', () => {
    const msg = { foo: 'bar' };
    const expected = null;
    const actual = sockets.getAction(msg);

    expect(actual).toEqual(expected);
  });

  test('handles msg with unknown type', () => {
    const msg = { type: 'foobar' };
    const expected = null;
    const actual = sockets.getAction(msg);

    expect(actual).toEqual(expected);
  });
});

describe('createSocket', () => {
  beforeEach(() => {
    Sockette.mockClear();
    mockJson.mockClear();
    mockClose.mockClear();
    mockOpen.mockClear();
  });

  test('creates socket with url', () => {
    sockets.createSocket({ url: '/my/url' });

    expect(Sockette).toHaveBeenCalledTimes(1);
    expect(Sockette.mock.calls[0][0]).toEqual('/my/url');
  });

  describe('events', () => {
    const dispatch = jest.fn();
    let socket, socketInstance;

    beforeEach(() => {
      dispatch.mockClear();
      socket = sockets.createSocket({ dispatch });
      socketInstance = Sockette.mock.calls[0][1];
    });

    describe('onopen', () => {
      test('logs', () => {
        socketInstance.onopen({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] connected',
        );
      });

      test('subscribes to pending objects', () => {
        const payload = { model: 'foo', id: 'bar' };
        socket.subscribe(payload);
        socketInstance.onopen({});

        expect(mockJson).toHaveBeenCalledWith(payload);
      });

      test('dispatches connectSocket action', () => {
        socketInstance.onopen({});
        const expected = connectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });
    });

    describe('onmessage', () => {
      test('logs', () => {
        socketInstance.onmessage({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] received:',
          undefined,
        );
      });

      test('dispatches action', () => {
        socketInstance.onmessage({
          data: { type: 'USER_TOKEN_INVALID' },
        });
        const expected = invalidateToken();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });
    });

    describe('onreconnect', () => {
      test('logs', () => {
        socketInstance.onreconnect({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] reconnecting...',
        );
      });
    });

    describe('onmaximum', () => {
      test('logs', () => {
        socketInstance.onmaximum({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] ending reconnect after Infinity attempts',
        );
      });
    });

    describe('onclose', () => {
      test('logs', () => {
        socketInstance.onclose({});

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });

      test('dispatches disconnectSocket action after 5 seconds', () => {
        jest.useFakeTimers();
        socketInstance.onopen({});
        socketInstance.onclose({});

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);

        setTimeout.mockClear();
        socketInstance.onclose({});

        expect(setTimeout).not.toHaveBeenCalled();
      });

      test('does not dispatch disconnectSocket action if reconnected', () => {
        jest.useFakeTimers();
        socketInstance.onopen({});
        socketInstance.onclose({});
        socketInstance.onopen({});
        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).not.toHaveBeenCalledWith(expected);
      });
    });

    describe('onerror', () => {
      test('logs', () => {
        socketInstance.onerror({});

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] error');
      });
    });
  });

  describe('subscribe', () => {
    let socket;
    const dispatch = jest.fn();

    beforeEach(() => {
      socket = sockets.createSocket({ dispatch });
    });

    describe('ws open', () => {
      test('subscribes to object', () => {
        const payload = { model: 'foo', id: 'bar' };
        Sockette.mock.calls[0][1].onopen();
        socket.subscribe(payload);

        expect(mockJson).toHaveBeenCalledWith(payload);
      });
    });
  });

  describe('reconnect', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket();
    });

    test('closes and reopens ws connection', () => {
      socket.reconnect();

      expect(mockClose).toHaveBeenCalledWith(1000, 'user logged out');
      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });
});
