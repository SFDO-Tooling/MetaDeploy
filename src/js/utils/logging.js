// @flow

export const logError = (
  message: string | Error,
  data: { [string]: mixed } = {},
) => {
  if (window.Sentry) {
    window.Sentry.withScope(scope => {
      scope.setExtras(data);
      if (message instanceof Error) {
        window.Sentry.captureException(message);
      } else {
        window.Sentry.captureMessage(message);
      }
    });
  }
  window.console.error(message, data);
};

export const log = (...args: Array<mixed>) => {
  window.console.info(...args);
};
