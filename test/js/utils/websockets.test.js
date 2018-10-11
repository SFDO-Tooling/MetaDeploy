import Sockette from 'sockette';

import * as sockets from 'utils/websockets';
import { invalidateToken } from 'accounts/actions';

jest.mock('sockette');
jest.mock('sockette');

describe('translator', () => {
  test('handles USER_TOKEN_INVALID msg', () => {
    const msg = { type: 'USER_TOKEN_INVALID' };
    const expected = invalidateToken();
    const actual = sockets.translator(msg);

    expect(actual).toEqual(expected);
  });

  test('handles unknown msg', () => {
    const msg = { foo: 'bar' };
    const expected = null;
    const actual = sockets.translator(msg);

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
