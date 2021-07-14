import Sockette from 'sockette';

import * as jobActions from '@/store/jobs/actions';
import { updateOrg } from '@/store/org/actions';
import * as preflightActions from '@/store/plans/actions';
import * as scratchOrgActions from '@/store/scratchOrgs/actions';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import { invalidateToken } from '@/store/user/actions';
import * as sockets from '@/utils/websockets';

const mockJson = jest.fn();
const mockClose = jest.fn();
const mockOpen = jest.fn();
const dispatch = jest.fn();
jest.mock('sockette', () =>
  jest.fn().mockImplementation(() => ({
    json: mockJson,
    close: mockClose,
    open: mockOpen,
  })),
);

const opts = { url: '/my/url', dispatch };

afterEach(() => {
  Sockette.mockClear();
  mockJson.mockClear();
  mockClose.mockClear();
  mockOpen.mockClear();
  dispatch.mockClear();
});

describe('getAction', () => {
  test('handles USER_TOKEN_INVALID msg', () => {
    const msg = { type: 'USER_TOKEN_INVALID' };
    const expected = invalidateToken();
    const actual = sockets.getAction(msg);

    expect(actual).toEqual(expected);
  });

  [
    { type: 'PREFLIGHT_COMPLETED', action: 'completePreflight' },
    { type: 'PREFLIGHT_FAILED', action: 'failPreflight' },
    { type: 'PREFLIGHT_CANCELED', action: 'cancelPreflight' },
    { type: 'PREFLIGHT_INVALIDATED', action: 'invalidatePreflight' },
  ].forEach(({ type, action }) => {
    test(`handles msg: ${type}`, () => {
      const payload = { foo: 'bar' };
      const msg = { type, payload };
      // eslint-disable-next-line import/namespace
      const expected = preflightActions[action](payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  [
    { type: 'TASK_COMPLETED', action: 'completeJobStep', thunk: false },
    { type: 'JOB_COMPLETED', action: 'completeJob', thunk: false },
    { type: 'JOB_FAILED', action: 'failJob', thunk: false },
    { type: 'JOB_CANCELED', action: 'cancelJob', thunk: false },
    { type: 'JOB_STARTED', action: 'createJob', thunk: true },
  ].forEach(({ type, action, thunk }) => {
    test(`handles msg: ${type}`, () => {
      const payload = { foo: 'bar' };
      const msg = { type, payload };
      // eslint-disable-next-line import/namespace
      let expected = jobActions[action](payload);
      let actual = sockets.getAction(msg);
      if (thunk) {
        const history = { location: {} };
        expected = expected((arg) => arg, undefined, history);
        actual = actual((arg) => arg, undefined, history);
      }

      expect(actual).toEqual(expected);
    });
  });

  describe('ORG_CHANGED', () => {
    test('handles msg', () => {
      const payload = {
        current_job: {
          id: 'my-job',
          product_slug: 'my-product',
          version_label: 'my-version',
          plan_slug: 'my-plan',
        },
        current_preflight: null,
      };
      const msg = { type: 'ORG_CHANGED', payload };
      const expected = updateOrg(payload);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  [
    { type: 'SCRATCH_ORG_CREATED', action: 'createScratchOrg', thunk: false },
    { type: 'SCRATCH_ORG_UPDATED', action: 'updateScratchOrg', thunk: false },
    { type: 'SCRATCH_ORG_ERROR', action: 'failScratchOrg', thunk: true },
    { type: 'SCRATCH_ORG_DELETED', action: 'failScratchOrg', thunk: true },
    { type: 'PREFLIGHT_STARTED', action: 'createPreflight', thunk: false },
  ].forEach(({ type, action, thunk }) => {
    test(`handles msg: ${type}`, () => {
      const payload = { foo: 'bar' };
      const msg = { type, payload };
      // eslint-disable-next-line import/namespace
      let expected = scratchOrgActions[action](payload);
      let actual = sockets.getAction(msg);
      if (thunk) {
        expected = expected((arg) => arg);
        actual = actual((arg) => arg);
      }

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
  test('creates socket with url', () => {
    sockets.createSocket(opts);

    expect(Sockette).toHaveBeenCalledTimes(1);
    expect(Sockette.mock.calls[0][0]).toEqual('/my/url');
  });

  describe('events', () => {
    let socket, socketInstance;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
      socketInstance = Sockette.mock.calls[0][1];
    });

    describe('onopen', () => {
      test('logs', () => {
        socketInstance.onopen();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] connected',
        );
      });

      test('subscribes to pending objects', () => {
        const payload = { model: 'foo', id: 'bar' };
        socket.subscribe(payload);
        socketInstance.onopen();

        expect(mockJson).toHaveBeenCalledWith(payload);
      });

      test('dispatches connectSocket action', () => {
        socketInstance.onopen();
        const expected = connectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });

      describe('after reconnect', () => {
        test('logs', () => {
          socketInstance.onreconnect();
          socketInstance.onreconnect();
          socketInstance.onopen();

          expect(window.console.info).toHaveBeenCalledWith(
            '[WebSocket] reconnected',
          );
        });
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
        socketInstance.onreconnect();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] attempting to reconnect…',
        );
      });
    });

    describe('onmaximum', () => {
      test('logs', () => {
        socketInstance.onmaximum();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] ending reconnect after Infinity attempts',
        );
      });
    });

    describe('onclose', () => {
      test('logs', () => {
        socketInstance.onclose();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });

      test('dispatches disconnectSocket action after 5 seconds', () => {
        jest.useFakeTimers();
        jest.spyOn(window, 'setTimeout');
        socketInstance.onopen();
        socketInstance.onclose();

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);

        setTimeout.mockClear();
        socketInstance.onclose();

        expect(setTimeout).not.toHaveBeenCalled();
      });

      test('does not dispatch disconnectSocket action if reconnected', () => {
        jest.useFakeTimers();
        socketInstance.onopen();
        socketInstance.onclose();
        socketInstance.onopen();
        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).not.toHaveBeenCalledWith(expected);
      });
    });

    describe('onerror', () => {
      test('logs', () => {
        socketInstance.onerror();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] error');
      });
    });
  });

  describe('subscribe', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
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
      socket = sockets.createSocket(opts);
      jest.useFakeTimers();
    });

    test('closes and reopens ws connection', () => {
      Sockette.mock.calls[0][1].onopen();
      mockOpen.mockClear();
      socket.reconnect();

      expect(mockClose).toHaveBeenCalledWith(1000, 'user logged out');
      expect(mockOpen).not.toHaveBeenCalled();

      jest.advanceTimersByTime(750);

      expect(mockOpen).not.toHaveBeenCalled();

      Sockette.mock.calls[0][1].onclose();
      jest.advanceTimersByTime(500);

      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });
});
