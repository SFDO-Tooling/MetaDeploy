import * as Sentry from '@sentry/browser';

import { Socket } from '@/js/utils/websockets';

declare global {
  interface Window {
    GLOBALS: { [key: string]: any };
    SITE_NAME: string;
    JS_CONTEXT: { [key: string]: any };
    Sentry?: typeof Sentry;
    api_urls: { [key: string]: (...args: any[]) => string };
    socket: Socket | null;
  }
}
