import Sockette from 'sockette';

import * as sockets from 'utils/websockets';
import { completeJobStep } from 'jobs/actions';
import {
  completePreflight,
  failPreflight,
  invalidatePreflight,
} from 'plans/actions';
import { invalidateToken } from 'accounts/actions';

jest.mock('sockette');

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

    test('handles msg (no payload)', () => {
      const msg = { type: 'PREFLIGHT_COMPLETED' };
      const expected = null;
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

    test('handles msg (no payload)', () => {
      const msg = { type: 'PREFLIGHT_FAILED' };
      const expected = null;
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

    test('handles msg (no payload)', () => {
      const msg = { type: 'PREFLIGHT_INVALIDATED' };
      const expected = null;
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });
  });

  describe('TASK_COMPLETED', () => {
    test('handles msg', () => {
      const job = { steps: [] };
      const msg = { type: 'TASK_COMPLETED', payload: job };
      const expected = completeJobStep(job);
      const actual = sockets.getAction(msg);

      expect(actual).toEqual(expected);
    });

    test('handles msg (no payload)', () => {
      const msg = { type: 'TASK_COMPLETED' };
      const expected = null;
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
});

describe('createSocket', () => {
  beforeEach(() => {
    Sockette.mockClear();
  });

  test('returns Sockette created with url', () => {
    const socket = sockets.createSocket({ url: '/my/url' });

    expect(socket).toBeInstanceOf(Sockette);
    expect(Sockette).toHaveBeenCalledTimes(1);
    expect(Sockette.mock.calls[0][0]).toEqual('/my/url');
  });

  describe('events', () => {
    const dispatch = jest.fn();

    beforeEach(() => {
      sockets.createSocket({ dispatch });
    });

    describe('onopen', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onopen({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] connected',
        );
      });
    });

    describe('onmessage', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onmessage({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] received:',
          undefined,
        );
      });

      test('dispatches action', () => {
        Sockette.mock.calls[0][1].onmessage({
          data: { type: 'USER_TOKEN_INVALID' },
        });
        const expected = invalidateToken();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });
    });

    describe('onreconnect', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onreconnect({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] reconnecting...',
        );
      });
    });

    describe('onmaximum', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onmaximum({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] ending reconnect after 25 attempts',
        );
      });
    });

    describe('onclose', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onclose({});

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });
    });

    describe('onerror', () => {
      test('logs', () => {
        Sockette.mock.calls[0][1].onerror({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] error:',
          {},
        );
      });
    });
  });
});
