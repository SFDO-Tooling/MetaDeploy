import * as Sentry from '@sentry/browser';

let config;
try {
  config = JSON.parse(document.getElementById('js-sentry-setup').innerHTML);
} catch (err) {
  // Error-logging is not available, but it's not worth throwing an Error
  // and stopping execution. Intentionally swallow Error and continue.
}

if (config && config.dsn) {
  window.Sentry = Sentry;

  // Configure Sentry
  Sentry.init({ dsn: config.dsn });
}
