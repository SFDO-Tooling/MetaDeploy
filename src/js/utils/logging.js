// @flow

export const logError = (
  message: string | Error,
  data: { [string]: mixed } = {},
) => {
  if (window.Raven && window.Raven.isSetup()) {
    if (message instanceof Error) {
      window.Raven.captureException(message);
    } else {
      window.Raven.captureMessage(message, { extra: data });
    }
  }
  window.console.error(message, data);
};
