// @flow

import cookies from 'js-cookie';

import { logError } from 'utils/logging';

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = method => /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getResponse = resp =>
  resp
    .text()
    .then(text => {
      try {
        return JSON.parse(text);
      } catch (err) {
        // swallow error
      }
      return text;
    })
    .catch(
      /* istanbul ignore next */
      err => {
        logError(err);
        throw err;
      },
    );

const getApiFetch = (onAuthFailure: () => void) => (
  url: string,
  opts: { [string]: mixed } = {},
) => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    options.headers['X-CSRFToken'] = cookies.get('csrftoken') || '';
  }

  return fetch(url, options)
    .then(response => {
      if (response.ok) {
        return getResponse(response);
      }
      if (response.status === 401) {
        onAuthFailure();
        return getResponse(response);
      }
      const error = (new Error(response.statusText): { [string]: mixed });
      error.response = response;
      throw error;
    })
    .catch(err => {
      logError(err);
      throw err;
    });
};

export default getApiFetch;
